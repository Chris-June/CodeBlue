import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGptsStore, type Gpt } from '@/stores/gptsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const AVAILABLE_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano'];
const EMOJI_AVATARS = ['🤖', '🧠', '🚀', '💡', '📈', '⚖️', '🎨', '👨‍💻', '👩‍🔬', '👨‍🏫', '🔎', '✨'];

interface GptCreatorFormProps {
  onFinished?: () => void;
}

const GptCreatorForm: React.FC<GptCreatorFormProps> = ({ onFinished }) => {
  const navigate = useNavigate();
  const { gptId } = useParams<{ gptId: string }>();
  const { addGpt, gpts, updateGpt } = useGptsStore();

  const isEditMode = !!gptId;
  const gptToEdit = isEditMode ? gpts.find((g) => g.id === gptId) : undefined;

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState([0.8]);
  const [topP, setTopP] = useState([1]);
  const [frequencyPenalty, setFrequencyPenalty] = useState([0]);
    const [maxTokens, setMaxTokens] = useState([1024]);
  const [model, setModel] = useState('gpt-4o');
  const [enableWebSearch, setEnableWebSearch] = useState(false);

  useEffect(() => {
    if (isEditMode && gptToEdit) {
      setName(gptToEdit.name);
      setAvatar(gptToEdit.avatar);
      setSystemPrompt(gptToEdit.systemPrompt);
      setTemperature([gptToEdit.temperature]);
      setTopP([gptToEdit.topP]);
      setFrequencyPenalty([gptToEdit.frequencyPenalty]);
            setMaxTokens([gptToEdit.maxTokens]);
      setModel(gptToEdit.model || 'gpt-4o');
      setEnableWebSearch(gptToEdit.enableWebSearch || false);
    }
  }, [isEditMode, gptToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) {
      alert('Name and System Prompt are required.');
      return;
    }

        const gptData: Omit<Gpt, 'id' | 'description'> & { description?: string } = {
      name,
      avatar,
      description: `A custom GPT named ${name}`,
      systemPrompt,
      temperature: temperature[0],
      topP: topP[0],
      frequencyPenalty: frequencyPenalty[0],
            maxTokens: maxTokens[0],
      model: model,
      enableWebSearch: enableWebSearch,
    };

    if (isEditMode && gptId) {
      updateGpt(gptId, gptData);
      if (onFinished) {
        onFinished();
      }
      navigate(`/g/${gptId}`);
    } else {
            const newGpt = { ...gptData, id: `gpt-${Date.now()}`, description: `A custom GPT named ${name}` };
      addGpt(newGpt as Gpt);
      
      if (onFinished) {
        onFinished();
      }
            navigate(`/g/${newGpt.id}`);
    }
  };

    const handleTest = () => {
    alert(`Testing GPT (not implemented yet):\n- Model: ${model}\n- Temperature: ${temperature[0]}\n- System Prompt: ${systemPrompt.substring(0, 100)}...`);
  };

  const handleCancel = () => {
    if (onFinished) {
      onFinished();
    } else {
      navigate(-1);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? `Edit ${gptToEdit?.name}` : 'Create a new GPT'}</CardTitle>
          <CardDescription>Define the personality and parameters for your custom AI assistant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
                    <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="avatar" className="text-right">Avatar</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="col-span-3 justify-start font-normal text-lg">
                  <span className="text-2xl mr-4">{avatar}</span>
                  Click to change
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="grid grid-cols-6 gap-1">
                  {EMOJI_AVATARS.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      className="text-2xl p-2 h-auto w-auto"
                      onClick={() => setAvatar(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Master"
              className="col-span-3"
            />
          </div>
                    <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model" className="text-right">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="web-search" className="text-right">
              Web Search
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch
                id="web-search"
                checked={enableWebSearch}
                onCheckedChange={setEnableWebSearch}
              />
              <Label htmlFor="web-search" className="text-sm font-normal text-muted-foreground">
                Allow the model to search the web for the latest information.
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="system-prompt" className="text-right pt-2">System Prompt</Label>
            <div className="col-span-3 space-y-1.5">
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful assistant..."
                className="min-h-[120px]"
                maxLength={4000} // Hard limit
              />
              <p className="text-sm text-muted-foreground text-right pr-1">
                {systemPrompt.length} / 2000
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
                        <div>
              <Label>Creativity (Temperature): {temperature[0].toFixed(1)}</Label>
              <Slider value={temperature} onValueChange={setTemperature} max={2} step={0.1} />
              <p className="text-sm text-muted-foreground">Controls randomness. Higher values make output more random.</p>
            </div>
                        <div>
              <Label>Diversity (Top P): {topP[0].toFixed(2)}</Label>
              <Slider value={topP} onValueChange={setTopP} max={1} step={0.05} />
              <p className="text-sm text-muted-foreground">Controls diversity via nucleus sampling.</p>
            </div>
                        <div>
              <Label>Repetition (Frequency Penalty): {frequencyPenalty[0].toFixed(1)}</Label>
              <Slider value={frequencyPenalty} onValueChange={setFrequencyPenalty} min={-2} max={2} step={0.1} />
              <p className="text-sm text-muted-foreground">Discourages repeating the same tokens.</p>
            </div>
            <div>
              <Label>Max Tokens: {maxTokens[0]}</Label>
              <Slider value={maxTokens} onValueChange={setMaxTokens} min={256} max={4096} step={256} />
              <p className="text-sm text-muted-foreground">Controls the maximum length of the model's response.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
                    <Button variant="ghost" type="button" onClick={handleTest}>
            Test
          </Button>
          <Button variant="outline" type="button" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit">{isEditMode ? 'Save Changes' : 'Create GPT'}</Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default GptCreatorForm;
