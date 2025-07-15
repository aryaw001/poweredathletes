import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Ruler, Play, Loader2 } from 'lucide-react';
import { Dialog } from '@headlessui/react'; 
import axios from 'axios';

const MEASUREMENT_LABELS = {
  1: 'Crown Height',
  2: 'Shoulder Height',
  3: 'Elbow Reach',
  4: 'Hip Height',
  5: 'Hand Reach',
  6: 'Knee Height',
  7: 'Ankle Height (manual)',
};

const BodyMeasurementControl = ({
  startBodyMeasurement,
  measuring,
  canSelectMeasurements,
  onSendCode,
  measurementType,
  lastSentMeasurementId,
  onManualAnkleHeight,
  onNewMeasurement, 
}) => {
  const [buttonsEnabled, setButtonsEnabled] = useState(false);
  const [showAnkleDialog, setShowAnkleDialog] = useState(false);
  const [ankleInput, setAnkleInput] = useState('');


  useEffect(() => {    // Sync state from WebSocket
    setButtonsEnabled(canSelectMeasurements);
  }, [canSelectMeasurements]);

  const handleStart = () => {
    startBodyMeasurement(); //  it will trigger 'START_MEASUREMENT' to ESP32
  };

  const sendMeasurementCommand = (id) => {
    if (buttonsEnabled && onSendCode) {
      if (id === 7) {
        setShowAnkleDialog(true);
      } else {
        onSendCode(id);
      }
    }
  };

  const handleAnkleSubmit = () => {
    if (ankleInput && onManualAnkleHeight) {
      onManualAnkleHeight(Number(ankleInput));
      setShowAnkleDialog(false);
      setAnkleInput('');
    }
  };

  //  function to save a measurement
  const saveMeasurement = async (measurementData) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) return;
    try {
      await axios.post('https://sandybrown-scorpion-516823.hostingersite.com/api.php?action=saveMeasurement', {
        user_id: user.id,
        crownHeight: measurementData[1],
        shoulderHeight: measurementData[2],
        elbowReach: measurementData[3],
        hipHeight: measurementData[4],
        handReach: measurementData[5],
        kneeHeight: measurementData[6],
        ankleHeight: measurementData[7],
      });
      
    } catch (err) {
      console.error('Error saving measurement:', err);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-blue-900/90 to-cyan-900/90 backdrop-blur-xl border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Ruler className="w-5 h-5" />
              Body Measurements
            </CardTitle>
            <CardDescription className="text-blue-200">
              Measure your body dimensions using ESP32 sensors
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Button
                onClick={handleStart}
                disabled={measuring}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3"
              >
                {measuring && measurementType === 'body' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Measuring...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Body Measurement
                  </>
                )}
              </Button>
            </div>

            {/* Buttons for each measurement */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(MEASUREMENT_LABELS).map(([id, label]) => (
                <Button
                  key={id}
                  variant="secondary"
                  className="text-sm text-white bg-blue-800 hover:bg-blue-700"
                  onClick={() => sendMeasurementCommand(Number(id))}
                  disabled={!buttonsEnabled || !measuring}
                >
                  {label}
                </Button>
              ))}
            </div>

            {measuring && (
              <p className="text-sm text-green-400 mt-2">
                Ready: Select Measurement (e.g., Crown Height)
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Manual Ankle Height Dialog */}
      <Dialog open={showAnkleDialog} onClose={() => setShowAnkleDialog(false)}>
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-80 text-black">
            <h2 className="text-lg font-semibold mb-2">Enter Ankle Height (cm)</h2>
            <input
              type="number"
              className="border rounded px-2 py-1 w-full mb-4 text-black"
              value={ankleInput}
              onChange={(e) => setAnkleInput(e.target.value)}
              placeholder="e.g. 18.5"
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setShowAnkleDialog(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleAnkleSubmit}
                disabled={!ankleInput}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default BodyMeasurementControl;