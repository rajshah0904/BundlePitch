import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Copy, Plus, Trash2, History, Sparkles } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { Toaster } from "./ui/toaster";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BundlePitchApp = () => {
  const [bundleName, setBundleName] = useState("");
  const [tone, setTone] = useState("");
  const [items, setItems] = useState([{ title: "", description: "", price: "" }]);
  const [generatedCopy, setGeneratedCopy] = useState(null);
  const [copyHistory, setCopyHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const toneOptions = [
    { value: "warm", label: "Warm & Heartfelt" },
    { value: "playful", label: "Playful & Fun" },
    { value: "minimal", label: "Minimal & Modern" },
    { value: "luxury", label: "Luxury & Elegant" },
    { value: "casual", label: "Casual & Friendly" },
    { value: "professional", label: "Professional & Trustworthy" }
  ];

  const characterLimits = {
    title: 140,
    pitch: 500,
    bullets: 300,
    instagram: 280
  };

  useEffect(() => {
    loadCopyHistory();
  }, []);

  const loadCopyHistory = async () => {
    try {
      const response = await axios.get(`${API}/copy-history`);
      setCopyHistory(response.data);
    } catch (error) {
      console.error("Error loading copy history:", error);
    }
  };

  const addItem = () => {
    setItems([...items, { title: "", description: "", price: "" }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const generateCopy = async () => {
    if (!bundleName || !tone || items.some(item => !item.title)) {
      toast({
        title: "Missing Information",
        description: "Please fill in bundle name, tone, and at least one item title.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const validItems = items.filter(item => item.title.trim());
      
      const response = await axios.post(`${API}/generate-copy`, {
        bundle_name: bundleName,
        tone: tone,
        items: validItems
      });
      
      setGeneratedCopy(response.data);
      
      // Reload history to show the new entry
      await loadCopyHistory();
      
      toast({
        title: "Copy Generated!",
        description: "Your bundle copy has been generated successfully.",
      });
      
    } catch (error) {
      console.error("Error generating copy:", error);
      toast({
        title: "Generation Failed",
        description: error.response?.data?.detail || "Failed to generate copy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard.`,
    });
  };

  const loadFromHistory = (historyItem) => {
    setBundleName(historyItem.bundle_name);
    setTone(toneOptions.find(t => t.label === historyItem.tone)?.value || "");
    setGeneratedCopy(historyItem.copy);
  };

  const getToneName = (toneValue) => {
    return toneOptions.find(t => t.value === toneValue)?.label || toneValue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              BundlePitch.ai
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create high-converting, emotionally engaging sales copy for your Etsy bundle listings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="text-xl">Bundle Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bundleName" className="text-sm font-medium">
                    Bundle Name/Goal
                  </Label>
                  <Input
                    id="bundleName"
                    placeholder="e.g., Pamper Yourself Gift Set"
                    value={bundleName}
                    onChange={(e) => setBundleName(e.target.value)}
                    className="border-2 focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone" className="text-sm font-medium">
                    Tone
                  </Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="border-2 focus:border-purple-500">
                      <SelectValue placeholder="Select tone for your copy" />
                    </SelectTrigger>
                    <SelectContent>
                      {toneOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Items in Bundle</Label>
                    <Button
                      onClick={addItem}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  
                  {items.map((item, index) => (
                    <Card key={index} className="border-2 border-gray-200 bg-gray-50/50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Item {index + 1}
                          </span>
                          {items.length > 1 && (
                            <Button
                              onClick={() => removeItem(index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs text-gray-600">Title</Label>
                            <Input
                              placeholder="Product title"
                              value={item.title}
                              onChange={(e) => updateItem(index, "title", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Description</Label>
                            <Input
                              placeholder="Short description"
                              value={item.description}
                              onChange={(e) => updateItem(index, "description", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Price</Label>
                            <Input
                              placeholder="0.00"
                              value={item.price}
                              onChange={(e) => updateItem(index, "price", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button
                  onClick={generateCopy}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Copy
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Copy History Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Copy History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {copyHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No copy history yet. Generate your first bundle copy!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {copyHistory.map((item) => (
                      <Card
                        key={item.id}
                        className="border border-gray-200 hover:border-purple-300 cursor-pointer transition-colors"
                        onClick={() => loadFromHistory(item)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm truncate">
                              {item.bundle_name}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {getToneName(item.tone)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Generated Copy Display */}
        {generatedCopy && (
          <Card className="mt-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="text-xl">Generated Copy</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Bundle Title */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold text-gray-700">
                    Bundle Title
                  </Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={generatedCopy.title.length > characterLimits.title ? "destructive" : "secondary"}>
                      {generatedCopy.title.length}/{characterLimits.title}
                    </Badge>
                    <Button
                      onClick={() => copyToClipboard(generatedCopy.title, "Title")}
                      size="sm"
                      variant="ghost"
                      className="text-gray-600 hover:text-purple-600"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <p className="text-sm font-medium">{generatedCopy.title}</p>
                </div>
              </div>

              <Separator />

              {/* Pitch Paragraph */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold text-gray-700">
                    Pitch Paragraph
                  </Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={generatedCopy.pitch.length > characterLimits.pitch ? "destructive" : "secondary"}>
                      {generatedCopy.pitch.length}/{characterLimits.pitch}
                    </Badge>
                    <Button
                      onClick={() => copyToClipboard(generatedCopy.pitch, "Pitch")}
                      size="sm"
                      variant="ghost"
                      className="text-gray-600 hover:text-purple-600"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <p className="text-sm leading-relaxed">{generatedCopy.pitch}</p>
                </div>
              </div>

              <Separator />

              {/* Bullet Points */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold text-gray-700">
                    Bullet Points
                  </Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={generatedCopy.bullets.join('\n').length > characterLimits.bullets ? "destructive" : "secondary"}>
                      {generatedCopy.bullets.join('\n').length}/{characterLimits.bullets}
                    </Badge>
                    <Button
                      onClick={() => copyToClipboard(generatedCopy.bullets.join('\n'), "Bullets")}
                      size="sm"
                      variant="ghost"
                      className="text-gray-600 hover:text-purple-600"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <ul className="text-sm space-y-1">
                    {generatedCopy.bullets.map((bullet, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Separator />

              {/* Instagram Caption */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold text-gray-700">
                    Instagram Caption
                  </Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={generatedCopy.instagram.length > characterLimits.instagram ? "destructive" : "secondary"}>
                      {generatedCopy.instagram.length}/{characterLimits.instagram}
                    </Badge>
                    <Button
                      onClick={() => copyToClipboard(generatedCopy.instagram, "Instagram Caption")}
                      size="sm"
                      variant="ghost"
                      className="text-gray-600 hover:text-purple-600"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <p className="text-sm leading-relaxed">{generatedCopy.instagram}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Toaster />
    </div>
  );
};

export default BundlePitchApp;