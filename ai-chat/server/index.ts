import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

interface FaqItem {
  question: string;
  answer: string;
}

let faqData: FaqItem[] = [];
try {
  const faqPath = path.join(__dirname, 'faq.json');
  const faqJson = fs.readFileSync(faqPath, 'utf-8');
  faqData = JSON.parse(faqJson);
} catch (error) {
  console.error('Could not load or parse faq.json:', error);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('AI Chat Server is running!');
});

app.post('/api/chat', async (req, res) => {
  const userApiKey = req.headers['x-user-api-key'] as string;
  const apiClient = userApiKey ? new OpenAI({ apiKey: userApiKey }) : openai;

  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    const { messages, model, temperature, top_p, frequency_penalty, max_tokens, gptId, system_prompt } = req.body;
    console.log('System prompt from request:', system_prompt ? system_prompt.substring(0, 100) + '...' : 'No system prompt');

    if (!messages) {
      return res.status(400).send('Messages are required');
    }

    let fullResponse = '';
    let isFaqMatch = false;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Step 1: For the default GPT, check for FAQ intent before generating a standard response
    if (gptId === 'gpt-default' && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1].content;
      const faqQuestionsWithIndices = faqData.map((item, index) => `${index}: "${item.question}"`).join('\n');

      const intentSystemPrompt = `You are an expert at classifying user intent. Your task is to determine if a user's question matches one of the questions in the provided list. The list is 0-indexed. Respond with only the single index number of the matching question if a strong match is found. Otherwise, respond with the string "null".`;
      const intentUserPrompt = `User question: "${lastUserMessage}"\n\nFAQ list:\n${faqQuestionsWithIndices}`;

      try {
        const intentCompletion = await apiClient.chat.completions.create({
          model: 'gpt-4o-mini', // Use a fast model for classification
          messages: [
            { role: 'system', content: intentSystemPrompt },
            { role: 'user', content: intentUserPrompt },
          ],
          temperature: 0,
          max_tokens: 50,
        });

        const matchedIndexStr = intentCompletion.choices[0]?.message?.content;

        if (matchedIndexStr && matchedIndexStr.toLowerCase() !== 'null') {
          const matchedIndex = parseInt(matchedIndexStr, 10);
          if (!isNaN(matchedIndex) && matchedIndex >= 0 && matchedIndex < faqData.length) {
            const faqMatch = faqData[matchedIndex];
            if (faqMatch) {
              isFaqMatch = true;
              fullResponse = faqMatch.answer;
              // Simulate a streaming effect for the cached response
              const chunks = fullResponse.match(/.{1,10}/g) || [];
              for (const chunk of chunks) {
                res.write(chunk);
                await new Promise((resolve) => setTimeout(resolve, 20));
              }
            }
          }
        }
      } catch (intentError) {
        console.error('Error during FAQ intent check:', intentError);
        // Proceed to normal response if intent check fails
      }
    }

    // If it wasn't an FAQ match (or for any other GPT), call the main OpenAI API
    if (!isFaqMatch) {
      // Prepare the messages array, including the system prompt if provided
      const messagesWithSystem = system_prompt 
        ? [{ role: 'system', content: system_prompt }, ...messages]
        : messages;

      // Ensure we're using the correct model and apply the system prompt
      const completionOptions: OpenAI.ChatCompletionCreateParams = {
        model: 'gpt-4o', // Force using gpt-4o
        messages: messagesWithSystem.map(m => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content
        })),
        temperature: temperature ?? 0.7,
        top_p: top_p ?? 0.9,
        frequency_penalty: frequency_penalty ?? 0,
        max_tokens: max_tokens ?? 1024,
        stream: true,
      };
      
      console.log('Sending to OpenAI with options:', {
        ...completionOptions,
        messages: completionOptions.messages.map(m => ({
          ...m,
          content: typeof m.content === 'string' 
            ? (m.content.length > 100 ? m.content.substring(0, 100) + '...' : m.content)
            : '[non-string content]'
        }))
      });

      const stream = await apiClient.chat.completions.create(completionOptions);

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          res.write(content);
        }
      }
    }

    // Step 2: Generate Smart Prompts (for both FAQ and API responses)
    try {
      const conversationForSummary = messages.slice(-4);
      conversationForSummary.push({ role: 'assistant', content: fullResponse });
      
      const summaryPrompt = `Summarize the key topics of this recent conversation in one sentence: ${JSON.stringify(conversationForSummary)}`;

      const summaryCompletion = await apiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: summaryPrompt }],
        max_tokens: 60,
      });
      const summary = summaryCompletion.choices[0]?.message?.content || '';

      const lastUserMessage = messages[messages.length - 1].content;
      const smartPromptSystem = `You are an expert at identifying engaging follow-up questions. Based on the following context, generate 4 brief, relevant questions the user might want to ask next. Return them as a JSON array of strings: ["question1", "question2", "question3", "question4"].`;
      const smartPromptUser = `Conversation summary: "${summary}"\n\nUser's last message: "${lastUserMessage}"\n\nAssistant's response: "${fullResponse.substring(0, 200)}..."`;

      const smartPromptCompletion = await apiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: smartPromptSystem },
          { role: 'user', content: smartPromptUser },
        ],
        temperature: 0.6,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      const promptsJson = smartPromptCompletion.choices[0]?.message?.content;
      if (promptsJson) {
        const promptsObject = JSON.parse(promptsJson);
        const promptsArray = promptsObject.prompts || promptsObject.questions || Object.values(promptsObject)[0];
        if (Array.isArray(promptsArray)) {
          res.write(`||SMART_PROMPTS||${JSON.stringify(promptsArray)}`);
        }
      }
    } catch (promptError) {
      console.error('Error generating smart prompts:', promptError);
    }

    res.end();
  } catch (error) {
    console.error('Error in /api/chat:', error);
    if (!res.headersSent) {
      res.status(500).send('An error occurred while communicating with OpenAI.');
    } else {
      res.end();
    }
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
