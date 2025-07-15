import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { User, Weight, Calendar, Save } from 'lucide-react';

const AthleteProfile = ({ onProfileComplete }) => {
  const [profile, setProfile] = useState({
    name: '',
    weight: '',
    age: ''
  });
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingProfile, setPendingProfile] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load existing profile from localStorage
    const savedProfile = localStorage.getItem('athleteProfile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfile(parsedProfile);
      if (parsedProfile.name && parsedProfile.weight && parsedProfile.age) {
        onProfileComplete(parsedProfile);
      }
    }
  }, [onProfileComplete]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const existingProfile = localStorage.getItem('athleteProfile');
    if (existingProfile) {
      // Ask for confirmation before overwriting
      setPendingProfile(profile);
      setShowConfirm(true);
      setLoading(false);
      return;
    }

    await saveProfile(profile);
  };

  const saveProfile = async (profileToSave) => {
    try {
      localStorage.setItem('athleteProfile', JSON.stringify(profileToSave));
      toast({
        title: "Profile saved! 🎯",
        description: "Your athlete profile has been updated successfully.",
      });
      onProfileComplete(profileToSave);
    } catch (error) {
      toast({
        title: "Error saving profile",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setPendingProfile(null);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Confirm dialog UI
  const renderConfirmDialog = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg text-gray-900">
        <h2 className="text-lg font-bold mb-2">Overwrite Profile?</h2>
        <p className="mb-4">A profile already exists. Saving will overwrite your previous data. Continue?</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setShowConfirm(false); setPendingProfile(null); }}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 text-white"
            onClick={() => saveProfile(pendingProfile)}
          >
            Overwrite
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {showConfirm && renderConfirmDialog()}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-gradient-to-br from-slate-900/90 to-blue-900/90 backdrop-blur-xl border-blue-500/20 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center"
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Athlete Profile
            </CardTitle>
            <CardDescription className="text-gray-300">
              Set up your profile to start measuring your performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-200">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-gray-200">Weight (kg)</Label>
                <div className="relative">
                  <Weight className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Enter your weight"
                    value={profile.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                    min="30"
                    max="200"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age" className="text-gray-200">Age</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter your age"
                    value={profile.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                    min="10"
                    max="100"
                    required
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile & Continue
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AthleteProfile;