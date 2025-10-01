"use client";

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload, X, ExternalLink } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface CreativeFormData {
  pageId: string;
  imageUploadType: "file" | "url";
  imageFile: File | null;
  imageUrl: string;
  imagePreview: string;
  message: string;
  headline: string;
  description: string;
  linkUrl: string;
  callToAction: string;
}

interface CreativeFormProps {
  data: CreativeFormData;
  onChange: (data: CreativeFormData) => void;
  pages: Array<{ id: string; name: string }>;
  isLoadingPages?: boolean;
}

const CALL_TO_ACTIONS = [
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "SHOP_NOW", label: "Shop Now" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "DOWNLOAD", label: "Download" },
  { value: "BOOK_TRAVEL", label: "Book Now" },
  { value: "CONTACT_US", label: "Contact Us" },
  { value: "GET_QUOTE", label: "Get Quote" },
  { value: "APPLY_NOW", label: "Apply Now" },
  { value: "SUBSCRIBE", label: "Subscribe" },
];

export function CreativeForm({
  data,
  onChange,
  pages,
  isLoadingPages = false,
}: CreativeFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof CreativeFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (max 30MB)
      if (file.size > 30 * 1024 * 1024) {
        alert("Image size must be less than 30MB");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({
          ...data,
          imageFile: file,
          imagePreview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    onChange({
      ...data,
      imageFile: null,
      imageUrl: "",
      imagePreview: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageUrlChange = (url: string) => {
    onChange({
      ...data,
      imageUrl: url,
      imagePreview: url,
    });
  };

  return (
    <div className="space-y-6">
      {/* Facebook Page */}
      <div className="space-y-2">
        <Label htmlFor="page">
          Facebook Page <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.pageId}
          onValueChange={(value) => handleChange("pageId", value)}
          disabled={isLoadingPages}
        >
          <SelectTrigger id="page">
            <SelectValue placeholder="Select a Facebook page" />
          </SelectTrigger>
          <SelectContent>
            {pages.map((page) => (
              <SelectItem key={page.id} value={page.id}>
                {page.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          The Facebook page that will publish this ad
        </p>
      </div>

      {/* Image Upload Type */}
      <div className="space-y-2">
        <Label>
          Image Source <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={data.imageUploadType}
          onValueChange={(value) =>
            handleChange("imageUploadType", value as "file" | "url")
          }
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="file" id="upload-file" />
            <Label htmlFor="upload-file" className="cursor-pointer">
              Upload File
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="url" id="upload-url" />
            <Label htmlFor="upload-url" className="cursor-pointer">
              Image URL
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Image Upload/URL */}
      {data.imageUploadType === "file" ? (
        <div className="space-y-2">
          <Label>
            Ad Image <span className="text-destructive">*</span>
          </Label>
          {!data.imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Click to upload image</p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF (max 30MB)
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative border rounded-lg p-4">
              <img
                src={data.imagePreview}
                alt="Preview"
                className="w-full h-auto rounded-lg max-h-96 object-contain"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-6 right-6"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
              {data.imageFile && (
                <p className="text-xs text-muted-foreground mt-2">
                  {data.imageFile.name} (
                  {(data.imageFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="image-url">
            Image URL <span className="text-destructive">*</span>
          </Label>
          <Input
            id="image-url"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={data.imageUrl}
            onChange={(e) => handleImageUrlChange(e.target.value)}
          />
          {data.imagePreview && (
            <div className="relative border rounded-lg p-4 mt-2">
              <img
                src={data.imagePreview}
                alt="Preview"
                className="w-full h-auto rounded-lg max-h-96 object-contain"
                onError={() => handleChange("imagePreview", "")}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-6 right-6"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Enter a publicly accessible image URL
          </p>
        </div>
      )}

      {/* Ad Copy Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Ad Copy</h3>

        {/* Message/Primary Text */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="message">
            Primary Text <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="message"
            placeholder="Tell people about your product or service..."
            value={data.message}
            onChange={(e) => handleChange("message", e.target.value)}
            rows={3}
            maxLength={500}
          />
          <div className="flex justify-between">
            <p className="text-xs text-muted-foreground">
              Main text that appears above your ad image
            </p>
            <span className="text-xs text-muted-foreground">
              {data.message.length}/500
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="headline">
            Headline <span className="text-destructive">*</span>
          </Label>
          <Input
            id="headline"
            placeholder="e.g., Summer Sale - 50% Off"
            value={data.headline}
            onChange={(e) => handleChange("headline", e.target.value)}
            maxLength={40}
          />
          <div className="flex justify-between">
            <p className="text-xs text-muted-foreground">
              Bold text that appears below the image
            </p>
            <span className="text-xs text-muted-foreground">
              {data.headline.length}/40
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Additional details (optional)"
            value={data.description}
            onChange={(e) => handleChange("description", e.target.value)}
            maxLength={125}
          />
          <div className="flex justify-between">
            <p className="text-xs text-muted-foreground">
              Secondary text below the headline
            </p>
            <span className="text-xs text-muted-foreground">
              {data.description.length}/125
            </span>
          </div>
        </div>

        {/* Link URL */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="link-url">
            Destination URL <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              id="link-url"
              type="url"
              placeholder="https://example.com/landing-page"
              value={data.linkUrl}
              onChange={(e) => handleChange("linkUrl", e.target.value)}
            />
            {data.linkUrl && (
              <Button variant="outline" size="icon" asChild>
                <a
                  href={data.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Where people will go when they click your ad
          </p>
        </div>

        {/* Call to Action */}
        <div className="space-y-2">
          <Label htmlFor="cta">
            Call to Action <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.callToAction}
            onValueChange={(value) => handleChange("callToAction", value)}
          >
            <SelectTrigger id="cta">
              <SelectValue placeholder="Select call to action" />
            </SelectTrigger>
            <SelectContent>
              {CALL_TO_ACTIONS.map((cta) => (
                <SelectItem key={cta.value} value={cta.value}>
                  {cta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Button text that appears on your ad
          </p>
        </div>
      </div>
    </div>
  );
}
