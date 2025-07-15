import React, { useEffect, useRef, useState } from 'react';
import BodyMeasurementControl from './BodyMeasurementControl';
import { useToast } from '@/components/ui/use-toast';

const BodyMeasurementWebSocket = ({ esp32Ip, onLiveMeasurement, addFinalMeasurement }) => {
  const ws = useRef(null);
  const [wsUrl, setWsUrl] = useState(localStorage.getItem('esp32WsUrl') || '');
  const [isConnected, setIsConnected] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [measurementType, setMeasurementType] = useState('');
  const [canSelectMeasurements, setCanSelectMeasurements] = useState(false);
  const [lastSentMeasurementId, setLastSentMeasurementId] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const { toast } = useToast();
  const [clientId] = useState(getOrCreateClientId);
  const [ipInput, setIpInput] = useState('');

  function getOrCreateClientId() {
    let id = localStorage.getItem('clientId');
    if (!id) {
      id = `webapp_${Math.floor(Math.random() * 100000)}`;
      localStorage.setItem('clientId', id);
    }
    return id;
  }

  useEffect(() => {
    if (!esp32Ip) return;

    const url = `ws://${esp32Ip}:81/`;
    setWsUrl(url);
    localStorage.setItem('esp32WsUrl', url);

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      setIsConnected(true);
      toast({
        title: 'WebSocket Connected ✅',
        description: `Connected to ESP32 at ${esp32Ip}`,
      });
      ws.current.send(
        JSON.stringify({
          type: 'UI_CLIENT_CONNECTED',
          clientId,
        })
      );
    };

    ws.current.onerror = () => {
      setIsConnected(false);
      toast({
        title: 'WebSocket Error ',
        description: `Could not connect to ESP32 at ${esp32Ip}`,
        variant: 'destructive',
      });
    };

    ws.current.onmessage = (event) => {
      const data = event.data;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'live_measurement') {
          onLiveMeasurement(parsed.data);
        }
        if (parsed.type === 'done') {
          const newData = mapSnakeToCamel(parsed.data);
          const updated = {
            ...newData,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            id: Date.now(),
          };
          setMeasurements((prev) => [updated, ...prev]);
          addFinalMeasurement(updated);
          setMeasuring(true);
          setMeasurementType('');
          onLiveMeasurement(null);
        }
      } catch (err) {
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [esp32Ip]);

  const handleConnect = () => {
    if (!ipInput) {
      toast({
        title: 'IP Required',
        description: 'Please enter the ESP32 IP address.',
        variant: 'destructive',
      });
      return;
    }
    const url = `ws://${ipInput}:81/`;
    setWsUrl(url);
    localStorage.setItem('esp32WsUrl', url);
  };

  const startBodyMeasurement = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send('START_MEASUREMENT');
      setMeasuring(true);
      setMeasurementType('body');
      setTimeout(() => setMeasuring(false), 30000);
      setTimeout(() => setCanSelectMeasurements(true), 2000);
    } else {
      toast({
        title: 'WebSocket Not Connected ',
        description: 'Cannot start measurement — ESP32 is not connected.',
        variant: 'destructive',
      });
    }
  };

  const sendMeasurementCommand = (code) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(String(code));
      setLastSentMeasurementId(code);
    } else {
      toast({
        title: 'WebSocket Not Connected ',
        description: "Can't send command — ESP32 is disconnected.",
        variant: 'destructive',
      });
    }
  };

  const handleManualAnkleHeight = (value) => {
    const updated = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      ankleHeight: value,
    };
    setMeasurements((prev) => [updated, ...prev]);
    addFinalMeasurement(updated);
  };

  const handleNewMeasurement = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send('START_MEASUREMENT');
      setMeasuring(true);
      setMeasurementType('body');
      setTimeout(() => setMeasuring(false), 30000);
      setTimeout(() => setCanSelectMeasurements(true), 2000);
    } else {
      toast({
        title: 'WebSocket Not Connected ',
        description: 'Cannot start measurement — ESP32 is not connected.',
        variant: 'destructive',
      });
    }
  };

  function mapSnakeToCamel(obj) {
    if (!obj) return obj;
    const map = {
      1: 'crownHeight',
      2: 'shoulderHeight',
      3: 'elbowReach',
      4: 'hipHeight',
      5: 'handReach',
      6: 'kneeHeight',
      7: 'ankleHeight',
      weight: 'weight',
      name: 'name',
      age: 'age',
    };
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [map[k] || k, v]));
  }

  return (
    <BodyMeasurementControl
      startBodyMeasurement={startBodyMeasurement}
      measuring={measuring}
      measurementType={measurementType}
      canSelectMeasurements={canSelectMeasurements}
      lastSentMeasurementId={lastSentMeasurementId}
      onSendCode={sendMeasurementCommand}
      measurements={measurements}
      onManualAnkleHeight={handleManualAnkleHeight}
      onNewMeasurement={handleNewMeasurement}
      esp32Ip={ipInput}
    />
  );
};

export default BodyMeasurementWebSocket;
