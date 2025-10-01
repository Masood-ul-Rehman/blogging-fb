"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

export interface AdSetFormData {
  name: string;
  budgetAmount: number;
  optimizationGoal: string;
  billingEvent: string;
  targeting: {
    ageMin: number;
    ageMax: number;
    genders: number[];
    countries: string[];
  };
  startDate?: string;
  endDate?: string;
}

interface AdSetFormProps {
  data: AdSetFormData;
  onChange: (data: AdSetFormData) => void;
  budgetType: "daily" | "lifetime";
  currency: string;
}

const OPTIMIZATION_GOALS = [
  { value: "LINK_CLICKS", label: "Link Clicks" },
  { value: "IMPRESSIONS", label: "Impressions" },
  { value: "REACH", label: "Reach" },
  { value: "LANDING_PAGE_VIEWS", label: "Landing Page Views" },
  { value: "POST_ENGAGEMENT", label: "Post Engagement" },
  { value: "OFFSITE_CONVERSIONS", label: "Conversions" },
];

const BILLING_EVENTS = [
  { value: "IMPRESSIONS", label: "Impressions (CPM)" },
  { value: "LINK_CLICKS", label: "Link Clicks (CPC)" },
];

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IN", label: "India" },
  { value: "BR", label: "Brazil" },
];

export function AdSetForm({
  data,
  onChange,
  budgetType,
  currency,
}: AdSetFormProps) {
  const handleChange = (field: keyof AdSetFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleTargetingChange = (
    field: keyof AdSetFormData["targeting"],
    value: any
  ) => {
    onChange({
      ...data,
      targeting: { ...data.targeting, [field]: value },
    });
  };

  const handleGenderToggle = (genderValue: number) => {
    const currentGenders = data.targeting.genders || [];
    const newGenders = currentGenders.includes(genderValue)
      ? currentGenders.filter((g) => g !== genderValue)
      : [...currentGenders, genderValue];
    handleTargetingChange("genders", newGenders);
  };

  const handleCountryToggle = (countryCode: string) => {
    const currentCountries = data.targeting.countries || [];
    const newCountries = currentCountries.includes(countryCode)
      ? currentCountries.filter((c) => c !== countryCode)
      : [...currentCountries, countryCode];
    handleTargetingChange("countries", newCountries);
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-6">
      {/* Ad Set Name */}
      <div className="space-y-2">
        <Label htmlFor="adset-name">
          Ad Set Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="adset-name"
          placeholder="e.g., Age 25-45 USA"
          value={data.name}
          onChange={(e) => handleChange("name", e.target.value)}
          maxLength={256}
        />
        <p className="text-xs text-muted-foreground">
          Name your ad set based on targeting or strategy
        </p>
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <Label htmlFor="budget">
          {budgetType === "daily" ? "Daily Budget" : "Lifetime Budget"}{" "}
          <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{currency}</span>
          <Input
            id="budget"
            type="number"
            min="1"
            step="0.01"
            placeholder="e.g., 50.00"
            value={data.budgetAmount || ""}
            onChange={(e) =>
              handleChange("budgetAmount", parseFloat(e.target.value) || 0)
            }
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Minimum budget is {currency} 1.00 per day
        </p>
      </div>

      {/* Schedule (only for lifetime budget) */}
      {budgetType === "lifetime" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">
              Start Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="start-date"
              type="date"
              min={getTodayDate()}
              value={data.startDate || ""}
              onChange={(e) => handleChange("startDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">
              End Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="end-date"
              type="date"
              min={data.startDate || getTodayDate()}
              value={data.endDate || ""}
              onChange={(e) => handleChange("endDate", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Optimization Goal */}
      <div className="space-y-2">
        <Label htmlFor="optimization">
          Optimization Goal <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.optimizationGoal}
          onValueChange={(value) => handleChange("optimizationGoal", value)}
        >
          <SelectTrigger id="optimization">
            <SelectValue placeholder="Select optimization goal" />
          </SelectTrigger>
          <SelectContent>
            {OPTIMIZATION_GOALS.map((goal) => (
              <SelectItem key={goal.value} value={goal.value}>
                {goal.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          What you want Facebook to optimize for
        </p>
      </div>

      {/* Billing Event */}
      <div className="space-y-2">
        <Label htmlFor="billing">
          Billing Event <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.billingEvent}
          onValueChange={(value) => handleChange("billingEvent", value)}
        >
          <SelectTrigger id="billing">
            <SelectValue placeholder="Select billing event" />
          </SelectTrigger>
          <SelectContent>
            {BILLING_EVENTS.map((event) => (
              <SelectItem key={event.value} value={event.value}>
                {event.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          What you'll be charged for
        </p>
      </div>

      {/* Targeting Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Audience Targeting</h3>

        {/* Age Range */}
        <div className="space-y-4 mb-6">
          <Label>
            Age Range <span className="text-destructive">*</span>
          </Label>
          <div className="px-2">
            <Slider
              min={18}
              max={65}
              step={1}
              value={[data.targeting.ageMin || 18, data.targeting.ageMax || 65]}
              onValueChange={(values) => {
                handleTargetingChange("ageMin", values[0]);
                handleTargetingChange("ageMax", values[1]);
              }}
              className="w-full"
            />
            <div className="flex justify-between mt-2">
              <span className="text-sm font-medium">
                {data.targeting.ageMin || 18}
              </span>
              <span className="text-sm font-medium">
                {data.targeting.ageMax === 65
                  ? "65+"
                  : data.targeting.ageMax || 65}
              </span>
            </div>
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-3 mb-6">
          <Label>
            Gender <span className="text-destructive">*</span>
          </Label>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gender-all"
                checked={
                  data.targeting.genders?.length === 2 ||
                  data.targeting.genders?.length === 0
                }
                onCheckedChange={() => handleTargetingChange("genders", [1, 2])}
              />
              <Label htmlFor="gender-all" className="cursor-pointer">
                All
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gender-male"
                checked={data.targeting.genders?.includes(1)}
                onCheckedChange={() => handleGenderToggle(1)}
              />
              <Label htmlFor="gender-male" className="cursor-pointer">
                Male
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gender-female"
                checked={data.targeting.genders?.includes(2)}
                onCheckedChange={() => handleGenderToggle(2)}
              />
              <Label htmlFor="gender-female" className="cursor-pointer">
                Female
              </Label>
            </div>
          </div>
        </div>

        {/* Countries */}
        <div className="space-y-3">
          <Label>
            Countries <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {COUNTRIES.map((country) => (
              <div key={country.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`country-${country.value}`}
                  checked={data.targeting.countries?.includes(country.value)}
                  onCheckedChange={() => handleCountryToggle(country.value)}
                />
                <Label
                  htmlFor={`country-${country.value}`}
                  className="cursor-pointer"
                >
                  {country.label}
                </Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Select at least one country to target
          </p>
        </div>
      </div>
    </div>
  );
}
