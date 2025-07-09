import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import ConfirmationDialog from './ConfirmationDialog';
import { useGptsStore } from '@/stores/gptsStore';
import { useUserStore } from '@/stores/userStore';

const AccountSettings: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notifications, setNotifications] = useState({
    productUpdates: true,
    securityAlerts: true,
  });

  // Mock user data for display purposes
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => () => {});
  const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmDescription, setConfirmDescription] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

    const { apiKey, setApiKey, avatar, setAvatar } = useUserStore();
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');

  const handleSaveApiKey = () => {
    setApiKey(localApiKey);
        alert('API Key saved!');
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const { deleteAllGpts } = useGptsStore();

  // Mock user data for display purposes
  const user = {
    name: 'Chris June',
    email: 'chris.june@intellisync.ca',
    avatarUrl: 'https://github.com/shadcn.png', // Using a placeholder avatar
    plan: 'Pro Plan',
  };

  const handleDeleteGpts = () => {
    setConfirmTitle('Are you absolutely sure?');
    setConfirmDescription('This will permanently delete all of your custom GPTs. This action cannot be undone.');
    setConfirmAction(() => () => {
      deleteAllGpts();
      console.log('All custom GPTs deleted.');
      setIsConfirmOpen(false);
    });
    setIsConfirmOpen(true);
  };

  const handleDeleteAccount = () => {
    setConfirmTitle('Are you sure you want to delete your account?');
    setConfirmDescription('This action is irreversible and will permanently delete all your data, including custom GPTs and chat history.');
    setConfirmAction(() => () => {
      console.log('User account deleted.');
      setIsConfirmOpen(false);
    });
    setIsConfirmOpen(true);
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    if (!newPassword || !currentPassword) {
      alert('Please fill in all password fields.');
      return;
    }
    console.log('Password change requested with:', { currentPassword, newPassword });
    // Reset fields after submission
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    alert('Password change request sent. You will be logged out.');
  };

  const handleNotificationToggle = (type: 'productUpdates' | 'securityAlerts') => {
    setNotifications((prev) => {
      const newSettings = { ...prev, [type]: !prev[type] };
      console.log('Notification settings updated:', newSettings);
      return newSettings;
    });
  };

  const handleSignOut = () => {
    console.log('Signing out...');
    alert('You have been signed out.');
  };

  return (
    <div className="space-y-6 p-4 max-h-[calc(100vh-20rem)] overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is how others will see you on the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
                            <AvatarImage src={avatar || user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
                        <div>
              <Button variant="outline" onClick={triggerFileInput}>Change Avatar</Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={user.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={user.email} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your billing and subscription details.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Current Plan: {user.plan}</p>
            <p className="text-sm text-muted-foreground">Your plan renews on July 30, 2025.</p>
          </div>
          <Button>Manage Subscription</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI API Key</CardTitle>
          <CardDescription>
            Provide your own OpenAI API key. This will override the default key.
            <br />
            <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
              Get your OpenAI API key here.
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveApiKey}>Save</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>Product Updates</Label>
              <p className="text-sm text-muted-foreground">Receive emails about new features and updates.</p>
            </div>
            <Switch
              checked={notifications.productUpdates}
              onCheckedChange={() => handleNotificationToggle('productUpdates')}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>Security Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified about important security events.</p>
            </div>
            <Switch
              checked={notifications.securityAlerts}
              onCheckedChange={() => handleNotificationToggle('securityAlerts')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password here. After saving, you'll be logged out.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          </div>
          <Button onClick={handlePasswordChange}>Change Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign Out</CardTitle>
          <CardDescription>Sign out of your account on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleSignOut}>Sign Out</Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete All Custom GPTs</p>
              <p className="text-sm text-muted-foreground">Remove all of your created assistants.</p>
            </div>
            <Button variant="destructive" onClick={handleDeleteGpts}>Delete GPTs</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently remove your account and all data.</p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmAction}
        title={confirmTitle}
        description={confirmDescription}
      />
    </div>
  );
};

export default AccountSettings;
