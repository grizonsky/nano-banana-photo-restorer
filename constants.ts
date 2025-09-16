import { PresetPrompt } from "./types";

export const PRESET_PROMPTS: PresetPrompt[] = [
  { id: "retouch_base", prompt: "Retouch this photo" },
  { id: "retouch_colorize", prompt: "Colorize photo and enhance details" },
  { id: "retouch_remove_dust", prompt: "Remove dust and scratches" },
  { id: "retouch_enhance_clarity", prompt: "Enhance image detail and clarity without altering composition" },
  { id: "retouch_sharpen", prompt: "Restore and sharpen faded image" },
  { id: "retouch_fix_damage", prompt: "Fix damage and improve overall quality" },
  { id: "retouch_brighten", prompt: "Brighten and contrast enhance old photo" },
  { id: "retouch_restore_colors", prompt: "Restore faded colors to be vibrant and natural" },
  { id: "retouch_remove_frame", prompt: "Remove photo frame and repair torn edges" },
  { id: "retouch_improve_skin", prompt: "Improve skin texture and reduce facial blemishes" },
  { id: "retouch_remove_noise", prompt: "Remove digital noise and grain from the photo" },
  { id: "retouch_soft_focus", prompt: "Apply a dreamy soft-focus effect" },
];

export const REIMAGINE_PRESET_PROMPTS: PresetPrompt[] = [
    { id: "reimagine_studio_portrait", prompt: "Studio portrait of the subject(s) in modern, plain clothing against a light background." },
    { id: "reimagine_futuristic_city", prompt: "Place the subject(s) in a futuristic city with flying cars." },
    { id: "reimagine_ancient_jungle", prompt: "Reimagine the person(s) as explorers in a lush, ancient jungle." },
    { id: "reimagine_sunny_beach", prompt: "Show the subject(s) on a beautiful, sunny beach at sunset." },
    { id: "reimagine_rustic_cabin", prompt: "Depict the person(s) in a cozy, rustic cabin with a fireplace." },
    { id: "reimagine_fantasy_forest", prompt: "Transform the scene into a vibrant, fantastical forest with glowing plants." },
    { id: "reimagine_film_noir", prompt: "Place the character(s) in a classic, black-and-white film noir scene." },
    { id: "reimagine_art_deco", prompt: "Dress the person(s) in elegant 1920s Art Deco fashion." },
    { id: "reimagine_cyberpunk", prompt: "Change the outfits to rugged, futuristic cyberpunk gear." },
    { id: "reimagine_medieval", prompt: "Place the subject(s) in royal, medieval-era attire." },
    { id: "reimagine_zen_garden", prompt: "Reimagine the scene as a serene zen garden with cherry blossoms." },
    { id: "reimagine_steampunk", prompt: "Place the subject(s) in a bustling steampunk city with brass machinery." },
];
