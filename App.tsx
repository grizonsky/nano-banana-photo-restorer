
import React, { useState, useCallback, useEffect } from 'react';
import { ResultItem, ComparisonMode, PromptMode } from './types';
import { restorePhoto } from './services/geminiService';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';
// Fix: Import REIMAGINE_PRESET_PROMPTS to correctly check against all preset prompts.
import { PRESET_PROMPTS, REIMAGINE_PRESET_PROMPTS } from './constants';
import SettingsModal from './components/SettingsModal';
import UpscalingModal from './components/UpscalingModal';

interface ImageState {
  dataUrl: string;
  mimeType: string;
}

const COOLDOWN_SECONDS = 60;

const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = (err) => {
          console.error("Failed to load image for dimension check", err);
          reject(new Error("Failed to get image dimensions."));
      }
      img.src = dataUrl;
    });
};

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null);
  const [processingImage, setProcessingImage] = useState<ImageState | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<ResultItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
  // Fix: Initialize prompt state with the string from the PresetPrompt object, not the object itself.
  const [prompt, setPrompt] = useState<string>(PRESET_PROMPTS[0].prompt);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('slider');
  const [error, setError] = useState<string | null>(null);
  const [promptMode, setPromptMode] = useState<PromptMode>('retouch');
  const [customPrompts, setCustomPrompts] = useState<{ retouch: string[], reimagine: string[] }>({ retouch: [], reimagine: [] });
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [beforeImageDimensions, setBeforeImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [afterImageDimensions, setAfterImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [quotaCooldownEnd, setQuotaCooldownEnd] = useState<number | null>(null);
  const [timeNow, setTimeNow] = useState(() => Date.now());

  useEffect(() => {
    try {
      const savedPrompts = localStorage.getItem('customPrompts');
      if (savedPrompts) {
        const parsed = JSON.parse(savedPrompts);
        if (Array.isArray(parsed)) {
          setCustomPrompts({ retouch: parsed, reimagine: [] });
        } else {
          setCustomPrompts(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load custom prompts from localStorage", e);
    }
  }, []);
  
  useEffect(() => {
    let timer: number | undefined;
    if (quotaCooldownEnd && timeNow < quotaCooldownEnd) {
      timer = setInterval(() => setTimeNow(Date.now()), 1000) as unknown as number;
    } else if (quotaCooldownEnd && timeNow >= quotaCooldownEnd) {
      // Cooldown is over, reset it.
      setQuotaCooldownEnd(null);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quotaCooldownEnd, timeNow]);

  const updateAndSelectResult = useCallback(async (result: ResultItem | null) => {
      setSelectedResult(result);
      
      if (!result) {
          setBeforeImageDimensions(null);
          setAfterImageDimensions(null);
          setImageDimensions(null);
          return;
      }
      
      const beforeUrl = result.sourceImageUrl ?? originalImage?.dataUrl ?? null;
      const afterUrl = result.imageUrl;

      try {
          const beforeDims = beforeUrl ? await getImageDimensions(beforeUrl) : null;
          const afterDims = afterUrl ? await getImageDimensions(afterUrl) : null;
          setBeforeImageDimensions(beforeDims);
          setAfterImageDimensions(afterDims);
          setImageDimensions(afterDims ?? beforeDims);
      } catch (e) {
          setError("Could not load image properties.");
          setBeforeImageDimensions(null);
          setAfterImageDimensions(null);
          setImageDimensions(null);
      }
  }, [originalImage?.dataUrl]);

  const saveCustomPrompts = (prompts: { retouch: string[], reimagine: string[] }) => {
    try {
      localStorage.setItem('customPrompts', JSON.stringify(prompts));
    } catch (e) {
      console.error("Failed to save custom prompts to localStorage", e);
    }
  };

  const addCustomPrompt = (newPrompt: string) => {
    // Fix: Correctly check if the new prompt is already in the preset prompts by mapping the presets to strings.
    const allPresetPrompts = [...PRESET_PROMPTS, ...REIMAGINE_PRESET_PROMPTS].map(p => p.prompt);
    if (newPrompt && !customPrompts[promptMode].includes(newPrompt) && !allPresetPrompts.includes(newPrompt)) {
      const updatedPrompts = {
        ...customPrompts,
        [promptMode]: [...customPrompts[promptMode], newPrompt]
      };
      setCustomPrompts(updatedPrompts);
      saveCustomPrompts(updatedPrompts);
    }
  };

  const deleteCustomPrompt = (promptToDelete: string) => {
    const updatedPrompts = {
      ...customPrompts,
      [promptMode]: customPrompts[promptMode].filter(p => p !== promptToDelete)
    };
    setCustomPrompts(updatedPrompts);
    saveCustomPrompts(updatedPrompts);
  };
  
  const handleClearAll = useCallback(() => {
    setOriginalImage(null);
    setProcessingImage(null);
    setResults([]);
    setSelectedResult(null);
    setError(null);
    // Fix: Set prompt to the string from the PresetPrompt object, not the object itself.
    setPrompt(PRESET_PROMPTS[0].prompt);
    setImageDimensions(null);
    setBeforeImageDimensions(null);
    setAfterImageDimensions(null);
    setPromptMode('retouch');
    setComparisonMode('slider');
    setQuotaCooldownEnd(null);
  }, []);

  const handleImageUpload = async (imageDataUrl: string, mimeType: string) => {
    handleClearAll();
    const imageState = { dataUrl: imageDataUrl, mimeType };
    setOriginalImage(imageState);
    setProcessingImage(imageState);
    
    const originalResult: ResultItem = {
        id: `original-${Date.now()}`,
        imageUrl: imageDataUrl,
        mimeType: mimeType,
        prompt: "Original Image",
        sourceImageUrl: imageDataUrl,
    };
    setResults([originalResult]);
    await updateAndSelectResult(originalResult);
  };

  const handleRestore = useCallback(async () => {
    if (!processingImage || isLoading || (quotaCooldownEnd && Date.now() < quotaCooldownEnd)) return;

    setIsLoading(true);
    setError(null);
    try {
      const base64Data = processingImage.dataUrl.split(',')[1];
      const result = await restorePhoto(base64Data, processingImage.mimeType, prompt);

      if (result) {
        const newResult: ResultItem = {
          id: `res-${Date.now()}`,
          imageUrl: result.imageUrl,
          mimeType: result.mimeType,
          prompt: prompt,
          sourceImageUrl: processingImage.dataUrl,
        };
        
        setResults(prev => {
            const updatedResults = [newResult, ...prev];
            return updatedResults.length > 15 ? updatedResults.slice(0, 15) : updatedResults;
        });
        setProcessingImage({ dataUrl: newResult.imageUrl, mimeType: newResult.mimeType });

        if (comparisonMode === 'single') {
            setComparisonMode('slider');
        }
        
        await updateAndSelectResult(newResult);

      } else {
        throw new Error('The model did not return an image. Please try a different prompt.');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      // Display the user-facing part of the error, and trigger cooldown if it's a quota error.
      setError(errorMessage.replace('QUOTA_EXCEEDED: ', ''));
      console.error(err);
      if (errorMessage.startsWith('QUOTA_EXCEEDED:')) {
        setQuotaCooldownEnd(Date.now() + COOLDOWN_SECONDS * 1000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [processingImage, prompt, isLoading, updateAndSelectResult, comparisonMode, quotaCooldownEnd]);
  
  const handleUseResultAsSource = async (result: ResultItem) => {
    setProcessingImage({ dataUrl: result.imageUrl, mimeType: result.mimeType });
    setPromptMode('reimagine'); 
    await updateAndSelectResult(result);
  };
  
  const handleResetToOriginal = async () => {
    if (originalImage) {
      setProcessingImage(originalImage);
      const originalResultItem = results.find(r => r.prompt === "Original Image");
      if (originalResultItem) {
          await updateAndSelectResult(originalResultItem);
      }
    }
  };
  
  const handleSelectResultForView = async (result: ResultItem) => {
    if (result.prompt === 'Image Edited') {
        setComparisonMode('single');
    } else if (comparisonMode === 'single') {
        setComparisonMode('slider');
    }
    await updateAndSelectResult(result);
  }

  const handleImageEdited = async (editedDataUrl: string, mimeType: string) => {
    const newResult: ResultItem = {
      id: `edit-${Date.now()}`,
      imageUrl: editedDataUrl,
      mimeType: mimeType,
      prompt: "Image Edited",
      sourceImageUrl: processingImage?.dataUrl,
    };
    
    setResults(prev => [newResult, ...prev]);
    setProcessingImage({ dataUrl: newResult.imageUrl, mimeType: newResult.mimeType });
    setComparisonMode('single');
    await updateAndSelectResult(newResult);
  };

  const downloadImage = (imageUrl: string, id: string, suffix = '') => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `restored-${id}${suffix}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const upscaleAndDownload = (result: ResultItem) => {
    setIsUpscaling(true);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsUpscaling(false);
            setError("Could not create canvas context for upscaling.");
            return;
        }

        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Apply subtle enhancements to contrast and saturation during the upscale draw.
        // This makes the result look sharper and more vibrant without complex algorithms or API calls.
        ctx.filter = 'contrast(105%) saturate(105%) brightness(102%)';

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Reset the filter in case the context is reused elsewhere (good practice).
        ctx.filter = 'none';

        const upscaledDataUrl = canvas.toDataURL(result.mimeType, 1.0);
        downloadImage(upscaledDataUrl, result.id, '-2x');
        setIsUpscaling(false);
    };
    img.onerror = () => {
        setIsUpscaling(false);
        setError("Failed to load image for upscaling.");
    }
    img.src = result.imageUrl;
  };

  const cooldownRemaining = quotaCooldownEnd ? Math.max(0, Math.ceil((quotaCooldownEnd - timeNow) / 1000)) : 0;
  const isQuotaLimited = cooldownRemaining > 0;

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <UpscalingModal isOpen={isUpscaling} />
      <LeftPanel
        onImageUpload={handleImageUpload}
        processingImageUrl={processingImage?.dataUrl}
        prompt={prompt}
        setPrompt={setPrompt}
        onRestore={handleRestore}
        isLoading={isLoading}
        hasImage={!!originalImage}
        onReset={handleResetToOriginal}
        isProcessingOriginal={originalImage?.dataUrl === processingImage?.dataUrl}
        customPrompts={customPrompts[promptMode]}
        onAddCustomPrompt={addCustomPrompt}
        onDeleteCustomPrompt={deleteCustomPrompt}
        promptMode={promptMode}
        setPromptMode={setPromptMode}
        isEditing={isEditing}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isQuotaLimited={isQuotaLimited}
        quotaCooldownRemaining={cooldownRemaining}
      />
      <CenterPanel
        beforeImage={selectedResult?.prompt === 'Original Image' ? null : (selectedResult?.sourceImageUrl ?? originalImage?.dataUrl ?? null)}
        afterImage={selectedResult?.imageUrl ?? null}
        mimeType={selectedResult?.mimeType ?? originalImage?.mimeType ?? 'image/png'}
        comparisonMode={comparisonMode}
        setComparisonMode={setComparisonMode}
        isLoading={isLoading}
        error={error}
        hasImage={!!originalImage}
        imageDimensions={imageDimensions}
        beforeImageDimensions={beforeImageDimensions}
        afterImageDimensions={afterImageDimensions}
        onImageEdited={handleImageEdited}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        selectedResult={selectedResult}
      />
      <RightPanel
        results={results}
        selectedResultId={selectedResult?.id ?? null}
        onSelectResult={handleSelectResultForView}
        onUseAsSource={handleUseResultAsSource}
        onDownloadResult={(result) => downloadImage(result.imageUrl, result.id)}
        onUpscaleAndDownload={upscaleAndDownload}
        onClearAll={handleClearAll}
        isLoading={isLoading}
      />
    </div>
  );
};

export default App;