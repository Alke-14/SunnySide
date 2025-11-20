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
import Weather from "./Weather";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ name: string; state?: string; country?: string }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [assistantResponse, setAssistantResponse] = useState("");
  const [aiError, setAiError] = useState("");
  const [error, setError] = useState("");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [iconUrl, setIconUrl] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const debounceRef = useRef<number | null>(null);

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

  const getWeather = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
      let base_url = "http://api.openweathermap.org/data/2.5/weather?";
      let complete_url = `${base_url}q=${city}&appid=${API_KEY}&units=metric`;
      // 1. Get weather data
      const response = await axios.get(complete_url);
      const weatherData = response.data;
      console.log(weatherData);
      const temp = weatherData.main.temp;
      const pressure = weatherData.main.pressure;
      const humidity = weatherData.main.humidity;
      const weatherText = weatherData.weather[0].description;
      const icon = weatherData.weather[0].icon;
      console.log(weatherText);
      const weatherString = `City: ${city}\nTemperature: ${temp} °C\nPressure: ${pressure} hPa\nHumidity: ${humidity}%\nCondition: ${weatherText}`;
      setWeather(weatherString);
      setIconUrl("http://openweathermap.org/img/wn/" + icon + "@2x.png");
      console.log("Weather String:", weatherString);
      setError("");
      // hide suggestions after explicit fetch
      setShowSuggestions(false);

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

  // Fetch city suggestions from OpenWeather Geocoding API
  const fetchCitySuggestions = async (q: string) => {
    const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
    if (!q || q.length < 2 || !API_KEY) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        q
      )}&limit=5&appid=${API_KEY}`;
      const resp = await axios.get(url);
      const data = resp.data || [];
      const items = data.map((it: any) => ({
        name: it.name,
        state: it.state,
        country: it.country,
      }));
      setSuggestions(items);
      setShowSuggestions(items.length > 0);
      setHighlightedIndex(-1);
    } catch (e) {
      console.error("Error fetching city suggestions", e);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleCityInputChange = (value: string) => {
    setCity(value);
    // debounce API calls
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    // wait 300ms after user stops typing
    debounceRef.current = window.setTimeout(() => {
      fetchCitySuggestions(value);
    }, 100);
  };

  const handleSuggestionSelect = (s: {
    name: string;
    state?: string;
    country?: string;
  }) => {
    const display = s.state
      ? `${s.name}, ${s.state}, ${s.country}`
      : `${s.name}, ${s.country}`;
    setCity(display);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSuggestionSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    console.log("Audio is playing:", isAudioPlaying);
  }, [isAudioPlaying]);

  return (
    <div className="bg-neutral-800 flex justify-center h-screen w-full">
      <div className="flex justify-evenly container gap-8 flex-wrap">
        <Card className="dark p-5 h-fit flex-1 my-auto">
          <CardHeader>
            <CardTitle>SunnySide</CardTitle>
            <CardDescription>
              This is a simple weather app which retrieves data from an API
              called <b>OpenWeather</b> along with the use of <b>FastAPI</b> to
              easily connect the Python backend with the frontend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={getWeather}>
              <div className="relative mb-2">
                <Input
                  type="text"
                  placeholder="Enter City"
                  value={city}
                  onChange={(e) => handleCityInputChange(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="mb-0"
                />

                {showSuggestions && suggestions.length > 0 && (
                  <ul
                    role="listbox"
                    aria-label="city suggestions"
                    className="absolute left-0 right-0 mt-1 bg-white text-black rounded shadow max-h-48 overflow-auto z-50"
                  >
                    {suggestions.map((s, i) => {
                      const label = s.state
                        ? `${s.name}, ${s.state}, ${s.country}`
                        : `${s.name}, ${s.country}`;
                      return (
                        <li
                          key={`${s.name}-${i}-${s.country}`}
                          role="option"
                          aria-selected={highlightedIndex === i}
                          onMouseDown={() => handleSuggestionSelect(s)}
                          className={`px-3 py-2 cursor-pointer ${
                            highlightedIndex === i ? "bg-gray-200" : ""
                          }`}
                        >
                          {label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <Button type="submit">Get Weather</Button>
            </form>

            <div
              className="border-4 rounded-sm p-2.5 flex items-center justify-between"
              style={{ marginTop: "20px", whiteSpace: "pre-wrap" }}
            >
              <div>
                {weather && <p>{weather}</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
              </div>
              <div>
                {iconUrl && (
                  <div>
                    <img src={iconUrl} alt="Weather Icon" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            &copy; 2025 Tutor Me Inc. All rights reserved.
          </CardFooter>
        </Card>
        <div className="weatherman flex-2 w-full h-full">
          {""}
          <Weather weather={weather} isAudioPlaying={isAudioPlaying} />
        </div>
      </div>
      {/* <Tabs defaultValue="city" className="h-screen w-[500px] justify-center "> */}
      {/* <TabsList>
          <TabsTrigger value="city">Find a City</TabsTrigger>
          <TabsTrigger value="assistant">Ask AI Assistant</TabsTrigger>
        </TabsList> */}
      {/* <TabsContent value="city"> */}

      {/* </TabsContent> */}
      {/* <TabsContent value="assistant"> */}
      {/* </TabsContent> */}
      {/* </Tabs> */}
    </div>
  );
}

export default App;
