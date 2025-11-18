import React from "react";
import clear from "@/assets/clear.jpg";
import clouds from "@/assets/clouds.png";
import rain from "@/assets/rain.jpeg";
import snow from "@/assets/snow.png";
import thunderstorm from "@/assets/thunderstorm.png";
import drizzle from "@/assets/drizzle.jpeg";
import other from "@/assets/other.webp";
import talking from "@/assets/amongla-talking.gif";
import still from "@/assets/amongla-still.gif";
import frame from "@/assets/frame.svg";

function Weather({
  weather,
  isAudioPlaying,
}: {
  weather: string;
  isAudioPlaying: boolean;
}) {
  return (
    <div className="relative w-fit h-full ">
      <img
        src={frame}
        alt="Frame"
        className="top-0 left-[50%] w-full h-full object-fill z-5 relative overflow-hidden rounded-4xl"
      />
      <img
        src={
          weather.toLowerCase().includes("clear")
            ? clear
            : weather.toLowerCase().includes("cloud")
            ? clouds
            : weather.toLowerCase().includes("rain")
            ? rain
            : weather.toLowerCase().includes("snow")
            ? snow
            : weather.toLowerCase().includes("thunderstorm")
            ? thunderstorm
            : weather.toLowerCase().includes("drizzle")
            ? drizzle
            : other
        }
        alt="Weather condition"
        className="absolute top-0 left-[50%] w-full rounded-[5rem] h-full object-fill"
      />
      <img
        src={isAudioPlaying ? talking : still}
        alt="Weatherman"
        className="absolute bottom-0 left-[75%] w-[200px] h-[200px]"
      />
    </div>
  );
}

export default Weather;
