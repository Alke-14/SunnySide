import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { IconPlus } from "@tabler/icons-react";
import { ArrowUpIcon, AppWindowIcon, CodeIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState("");
  const [assistantResponse, setAssistantResponse] = useState("");
  const [aiError, setAiError] = useState("");
  const [error, setError] = useState("");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const startLevelMonitoring = (audio: HTMLAudioElement) => {
    // Create / reuse AudioContext
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    const audioCtx = audioContextRef.current;

    // Some browsers require resume() after a user gesture
    audioCtx.resume();

    // Create a source from the <audio> element
    const source = audioCtx.createMediaElementSource(audio);

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;

    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    analyserRef.current = analyser;

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    dataArrayRef.current = dataArray;

    const threshold = 0.02; // tweak this for sensitivity

    const checkLevel = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      // @ts-ignore
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

      // Compute RMS (root mean square) of the signal
      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArrayRef.current[i] - 128) / 128; // normalize -1..1
        sumSquares += v * v;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);

      // Voice detected if over threshold
      setIsAudioPlaying(rms > threshold);

      rafIdRef.current = requestAnimationFrame(checkLevel);
    };

    // Start monitoring
    checkLevel();

    // When audio ends, stop monitoring
    audio.onended = () => {
      setIsAudioPlaying(false);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  };

  const getWeather = async () => {
    try {
      // 1. Get weather data
      const response = await axios.get(
        `https://sunnyside-91z4.onrender.com/weather?city=${city}`
      );

      const weatherText = response.data.weather;
      setWeather(weatherText);
      setError("");

      // --- 2. Stream Audio (The New Way) ---

      // Stop any audio that is currently playing
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // State to track if audio is playing (volume > 0)
      // (Place this at the top of your component)

      // Encode the text to make it safe to use in a URL
      const encodedText = encodeURIComponent(
        "City: " + city + " Weather: " + weatherText
      );
      console.log(encodedText);

      // Point the Audio object directly at your streaming endpoint
      // (Using localhost:8000 as in your example)
      const audioStreamUrl = `http://localhost:8000/stream-audio?weather=${encodedText}`;

      const audio = new Audio();
      audio.crossOrigin = "anonymous";  
      audio.src = audioStreamUrl;
      audioRef.current = audio; // Store it in the ref

      // Optional: Add error handling for audio
      audio.onerror = () => {
        console.error("Audio playback error.");
        // You could set a different error state here
      };

      // 3. Play the audio
      audio.play();

      startLevelMonitoring(audio);
    } catch (err) {
      setError("City not found or server error" + (err as Error).message);
      setWeather("");
    }
  };

  useEffect(() => {
    console.log("Audio is playing:", isAudioPlaying);
  }, [isAudioPlaying]);

  return (
    <div className="bg-[#E6D5AD] flex justify-center">
      <Tabs defaultValue="city" className="h-screen w-[500px] justify-center ">
        <TabsList>
          <TabsTrigger value="city">Find a City</TabsTrigger>
          <TabsTrigger value="assistant">Ask AI Assistant</TabsTrigger>
        </TabsList>
        <TabsContent value="city">
          <Card className="p-5 h-fit">
            <CardHeader>
              <CardTitle>SunnySide</CardTitle>
              {isAudioPlaying && (
                <CardDescription>Audio is playing...</CardDescription>
              )}
              <CardDescription>
                This is a simple weather app which retrieves data from an API
                called <b>OpenWeather</b> along with the use of <b>FastAPI</b>{" "}
                to easily connect the Python backend with the frontend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                placeholder="Enter City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mb-2"
              />
              <Button onClick={getWeather}>Get Weather</Button>

              <div
                className="border-4 rounded-sm p-2.5"
                style={{ marginTop: "20px", whiteSpace: "pre-wrap" }}
              >
                {weather && <p>{weather}</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
              </div>
            </CardContent>
            <CardFooter>
              &copy; 2025 Tutor Me Inc. All rights reserved.
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="assistant">
          <Card className="p-5">
            <InputGroup>
              <InputGroupTextarea
                className=""
                placeholder="Ask, Search or Chat..."
              />
              <InputGroupAddon align="block-end">
                <InputGroupButton
                  variant="outline"
                  className="rounded-full"
                  size="icon-xs"
                >
                  <IconPlus />
                </InputGroupButton>

                <InputGroupText className="ml-auto"></InputGroupText>
                <Separator orientation="vertical" className="!h-4" />
                <InputGroupButton
                  variant="default"
                  className="rounded-full"
                  size="icon-xs"
                  disabled
                >
                  <ArrowUpIcon />
                  <span className="sr-only">Send</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
