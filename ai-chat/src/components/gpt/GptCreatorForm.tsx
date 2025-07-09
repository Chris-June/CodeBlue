import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGptsStore, type Gpt } from '@/stores/gptsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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

  useEffect(() => {
    if (isEditMode && gptToEdit) {
      setName(gptToEdit.name);
      setAvatar(gptToEdit.avatar);
      setSystemPrompt(gptToEdit.systemPrompt);
      setTemperature([gptToEdit.temperature]);
      setTopP([gptToEdit.topP]);
      setFrequencyPenalty([gptToEdit.frequencyPenalty]);
      setMaxTokens([gptToEdit.maxTokens]);
    }
  }, [isEditMode, gptToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) {
      alert('Name and System Prompt are required.');
      return;
    }

    const gptData: Omit<Gpt, 'id'> = {
      name,
      avatar,
      description: `A custom GPT named ${name}`,
      systemPrompt,
      temperature: temperature[0],
      topP: topP[0],
      frequencyPenalty: frequencyPenalty[0],
      maxTokens: maxTokens[0],
    };

    if (isEditMode && gptId) {
      updateGpt(gptId, gptData);
      if (onFinished) {
        onFinished();
      }
      navigate(`/g/${gptId}`);
    } else {
      const newGpt = { ...gptData, id: `gpt-${Date.now()}` };
      addGpt(newGpt);
      if (onFinished) {
        onFinished();
      }
      navigate(`/g/${newGpt.id}`);
    }
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
            <Input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="col-span-3"
              maxLength={2}
            />
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
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="system-prompt" className="text-right pt-2">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant..."
              className="col-span-3 min-h-[120px]"
            />
          </div>

          <div className="space-y-4 pt-4">
            <div>
              <Label>Temperature: {temperature[0].toFixed(1)}</Label>
              <Slider value={temperature} onValueChange={setTemperature} max={2} step={0.1} />
              <p className="text-sm text-muted-foreground">Controls randomness. Higher values make output more random.</p>
            </div>
            <div>
              <Label>Top P: {topP[0].toFixed(2)}</Label>
              <Slider value={topP} onValueChange={setTopP} max={1} step={0.05} />
              <p className="text-sm text-muted-foreground">Controls diversity. Higher values make output more diverse.</p>
            </div>
            <div>
              <Label>Frequency Penalty: {frequencyPenalty[0].toFixed(1)}</Label>
              <Slider value={frequencyPenalty} onValueChange={setFrequencyPenalty} min={-2} max={2} step={0.1} />
              <p className="text-sm text-muted-foreground">Decreases the model's likelihood to repeat the same line verbatim.</p>
            </div>
            <div>
              <Label>Max Tokens: {maxTokens[0]}</Label>
              <Slider value={maxTokens} onValueChange={setMaxTokens} min={256} max={4096} step={256} />
              <p className="text-sm text-muted-foreground">Controls the maximum length of the model's response.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
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
