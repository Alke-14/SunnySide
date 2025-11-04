import { useState } from "react";
import axios from "axios";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"


function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState("");
  const [error, setError] = useState("");

  const getWeather = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/weather?city=${city}`);
      setWeather(response.data.weather);
      setError("");
    } catch (err) {
      setError("City not found or server error");
      setWeather("");
    }
  };

  return (
    <div className="bg-[#E6D5AD]">
      <div className="flex items-center justify-center h-screen p-4">
        <Card className="p-5 h-fit">
          <CardHeader>
            <CardTitle>SunnySide</CardTitle>
            <CardDescription>This is a simple weather app which retrieves data from an API called <b>OpenWeather</b> along with the use of <b>FastAPI</b> to easily connect the Python backend with the frontend</CardDescription>
            
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

            <div className="border-4 rounded-sm p-2.5" style={{ marginTop: "20px", whiteSpace: "pre-wrap" }}>
              {weather && <p>{weather}</p>}
              {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
          </CardContent>
          <CardFooter>
            &copy; 2025 Tutor Me Inc. All rights reserved.
          </CardFooter>
        </Card>
        
      </div>
    </div>
  );
}

export default App;
