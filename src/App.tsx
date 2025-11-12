import { useState } from "react";
import axios from "axios";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { IconPlus } from "@tabler/icons-react"
import { ArrowUpIcon, AppWindowIcon, CodeIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"


function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState("");
  const [assistantResponse, setAssistantResponse] = useState("");
  const [aiError, setAiError] = useState("");
  const [error, setError] = useState("");

  const getWeather = async () => {
    try {
      // axios handles the GET request to send to the FastAPI backend using the deployed URL from Render
      const response = await axios.get(`https://sunnyside-91z4.onrender.com/weather?city=${city}`);
      setWeather(response.data.weather);
      setError("");
    } catch (err) {
      setError("City not found or server error");
      setWeather("");
    }
  };

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
        </TabsContent>
        <TabsContent value="assistant">
          <Card className="p-5">
            <InputGroup>
              <InputGroupTextarea className="" placeholder="Ask, Search or Chat..."/>
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
