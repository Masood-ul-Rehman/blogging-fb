"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdCreationWizard } from "@/components/ads/ad-creation-wizard";
import { CampaignForm, CampaignFormData } from "@/components/ads/campaign-form";
import { AdSetForm, AdSetFormData } from "@/components/ads/adset-form";
import { CreativeForm, CreativeFormData } from "@/components/ads/creative-form";
import { ReviewStep } from "@/components/ads/review-step";
import { AdAccountSelector } from "@/components/ads/ad-account-selector";
import { TokenStatus } from "@/components/ads/token-status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const STEPS = [
  {
    id: 1,
    title: "Campaign",
    description: "Set up your campaign objective and budget type",
  },
  {
    id: 2,
    title: "Ad Set",
    description: "Configure budget, targeting, and optimization",
  },
  {
    id: 3,
    title: "Creative",
    description: "Upload your ad image and write copy",
  },
  {
    id: 4,
    title: "Review",
    description: "Review and publish your ad",
  },
];

export default function CreateAdPage() {
  const router = useRouter();
  const adAccounts = useQuery(api.facebook.queries.getAdAccounts) || [];
  const hasConnection = useQuery(api.facebook.queries.hasActiveConnection);

  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // Fetch Facebook pages
  const [pages, setPages] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const fetchPages = useAction(api.facebook.actions.fetchFacebookPages);

  // Form data state
  const [campaignData, setCampaignData] = useState<CampaignFormData>({
    name: "",
    objective: "OUTCOME_TRAFFIC",
    budgetType: "daily",
  });

  const [adSetData, setAdSetData] = useState<AdSetFormData>({
    name: "",
    budgetAmount: 10,
    optimizationGoal: "LINK_CLICKS",
    billingEvent: "IMPRESSIONS",
    targeting: {
      ageMin: 18,
      ageMax: 65,
      genders: [1, 2],
      countries: ["US"],
    },
  });

  const [creativeData, setCreativeData] = useState<CreativeFormData>({
    pageId: "",
    imageUploadType: "file",
    imageFile: null,
    imageUrl: "",
    imagePreview: "",
    message: "",
    headline: "",
    description: "",
    linkUrl: "",
    callToAction: "LEARN_MORE",
  });

  const [adStatus, setAdStatus] = useState<"ACTIVE" | "PAUSED">("PAUSED");

  // Create ad action
  const createCompleteAd = useAction(api.facebook.actions.createCompleteAd);

  // Set initial account
  useEffect(() => {
    if (adAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(adAccounts[0].id);
    }
  }, [adAccounts, selectedAccount]);

  // Fetch pages when account is selected
  useEffect(() => {
    if (selectedAccount) {
      loadPages();
    }
  }, [selectedAccount]);

  const loadPages = async () => {
    setIsLoadingPages(true);
    try {
      const fetchedPages = await fetchPages({});
      setPages(fetchedPages);
      if (fetchedPages.length > 0 && !creativeData.pageId) {
        setCreativeData((prev) => ({ ...prev, pageId: fetchedPages[0].id }));
      }
    } catch (error: any) {
      toast.error(`Failed to load Facebook pages: ${error.message}`);
    } finally {
      setIsLoadingPages(false);
    }
  };

  const selectedAccountData = adAccounts.find(
    (acc) => acc.id === selectedAccount
  );

  // Validation functions
  const validateCampaign = (): boolean => {
    if (!campaignData.name.trim()) {
      setError("Campaign name is required");
      return false;
    }
    if (!campaignData.objective) {
      setError("Campaign objective is required");
      return false;
    }
    setError("");
    return true;
  };

  const validateAdSet = (): boolean => {
    if (!adSetData.name.trim()) {
      setError("Ad set name is required");
      return false;
    }
    if (!adSetData.budgetAmount || adSetData.budgetAmount < 1) {
      setError("Budget must be at least $1.00");
      return false;
    }
    if (
      campaignData.budgetType === "lifetime" &&
      (!adSetData.startDate || !adSetData.endDate)
    ) {
      setError("Start and end dates are required for lifetime budget");
      return false;
    }
    if (
      !adSetData.targeting.countries ||
      adSetData.targeting.countries.length === 0
    ) {
      setError("At least one country must be selected");
      return false;
    }
    if (
      !adSetData.targeting.genders ||
      adSetData.targeting.genders.length === 0
    ) {
      setError("At least one gender must be selected");
      return false;
    }
    setError("");
    return true;
  };

  const validateCreative = (): boolean => {
    if (!creativeData.pageId) {
      setError("Facebook page is required");
      return false;
    }
    if (
      creativeData.imageUploadType === "file" &&
      !creativeData.imageFile &&
      !creativeData.imagePreview
    ) {
      setError("Ad image is required");
      return false;
    }
    if (creativeData.imageUploadType === "url" && !creativeData.imageUrl) {
      setError("Image URL is required");
      return false;
    }
    if (!creativeData.message.trim()) {
      setError("Primary text is required");
      return false;
    }
    if (!creativeData.headline.trim()) {
      setError("Headline is required");
      return false;
    }
    if (!creativeData.linkUrl.trim()) {
      setError("Destination URL is required");
      return false;
    }
    // Validate URL format
    try {
      new URL(creativeData.linkUrl);
    } catch {
      setError("Please enter a valid URL");
      return false;
    }
    if (!creativeData.callToAction) {
      setError("Call to action is required");
      return false;
    }
    setError("");
    return true;
  };

  const canGoToNextStep = (): boolean => {
    switch (currentStep) {
      case 0:
        return campaignData.name.trim() !== "" && campaignData.objective !== "";
      case 1:
        return (
          adSetData.name.trim() !== "" &&
          adSetData.budgetAmount >= 1 &&
          adSetData.targeting.countries.length > 0
        );
      case 2:
        return (
          creativeData.pageId !== "" &&
          (creativeData.imageFile !== null || creativeData.imageUrl !== "") &&
          creativeData.message.trim() !== "" &&
          creativeData.headline.trim() !== "" &&
          creativeData.linkUrl.trim() !== ""
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    let isValid = false;

    switch (currentStep) {
      case 0:
        isValid = validateCampaign();
        break;
      case 1:
        isValid = validateAdSet();
        break;
      case 2:
        isValid = validateCreative();
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);
      setError("");
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setError("");
  };

  const handleSubmit = async () => {
    if (!selectedAccount) {
      toast.error("Please select an ad account");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Convert image file to base64 if using file upload
      let imageBytes: string | undefined;
      let imageUrl: string | undefined;

      if (creativeData.imageUploadType === "file" && creativeData.imageFile) {
        const reader = new FileReader();
        imageBytes = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            // Remove data:image/xxx;base64, prefix
            const base64Data = base64.split(",")[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(creativeData.imageFile!);
        });
      } else {
        imageUrl = creativeData.imageUrl;
      }

      // Convert budget to cents (Facebook API expects cents)
      const budgetInCents = Math.round(adSetData.budgetAmount * 100);

      // Prepare dates for lifetime budget
      let startTime: string | undefined;
      let endTime: string | undefined;

      if (campaignData.budgetType === "lifetime") {
        if (adSetData.startDate) {
          startTime = new Date(adSetData.startDate).toISOString();
        }
        if (adSetData.endDate) {
          endTime = new Date(adSetData.endDate).toISOString();
        }
      }

      const result = await createCompleteAd({
        adAccountId: selectedAccount,
        // Campaign
        campaignName: campaignData.name,
        objective: campaignData.objective,
        // Ad Set
        adSetName: adSetData.name,
        dailyBudget:
          campaignData.budgetType === "daily" ? budgetInCents : undefined,
        lifetimeBudget:
          campaignData.budgetType === "lifetime" ? budgetInCents : undefined,
        billingEvent: adSetData.billingEvent,
        optimizationGoal: adSetData.optimizationGoal,
        startTime,
        endTime,
        targeting: {
          ageMin: adSetData.targeting.ageMin,
          ageMax: adSetData.targeting.ageMax,
          genders: adSetData.targeting.genders,
          geoLocations: {
            countries: adSetData.targeting.countries,
          },
        },
        // Creative
        creativeName: `${campaignData.name} - Creative`,
        pageId: creativeData.pageId,
        imageBytes,
        imageUrl,
        linkUrl: creativeData.linkUrl,
        message: creativeData.message,
        headline: creativeData.headline,
        description: creativeData.description,
        callToActionType: creativeData.callToAction,
        // Ad
        adName: `${campaignData.name} - Ad`,
        status: adStatus,
      });

      toast.success("Ad created successfully!");
      router.push(`/app/ads/performance?account=${selectedAccount}`);
    } catch (error: any) {
      console.error("Failed to create ad:", error);
      setError(error.message || "Failed to create ad. Please try again.");
      toast.error(error.message || "Failed to create ad");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has Facebook connection
  if (hasConnection === false) {
    return (
      <main className="container mx-auto py-8 px-4 flex-1">
        <div className="mb-8">
          <Link href="/app/ads/list">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Ads
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Create New Ad</h1>
          <p className="text-muted-foreground mb-8">
            Connect your Facebook account to create ads
          </p>

          <TokenStatus />
        </div>
      </main>
    );
  }

  if (adAccounts.length === 0) {
    return (
      <main className="container mx-auto py-8 px-4 flex-1">
        <div className="mb-8">
          <Link href="/app/ads/list">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Ads
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Create New Ad</h1>
          <p className="text-muted-foreground mb-8">No ad accounts available</p>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have any ad accounts available. Please make sure your
              Facebook account has access to at least one ad account.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4 flex-1">
      <div className="mb-8">
        <Link href="/app/ads/list">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Ads
          </Button>
        </Link>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Create New Ad</h1>
        <p className="text-muted-foreground">
          Follow the steps below to create and publish your Facebook ad
        </p>
      </div>

      {/* Ad Account Selector */}
      <div className="max-w-4xl mx-auto mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Select Ad Account</CardTitle>
            <CardDescription>
              Choose which ad account to create this ad in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdAccountSelector
              value={selectedAccount}
              onValueChange={setSelectedAccount}
            />
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-4xl mx-auto mb-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Wizard */}
      <AdCreationWizard
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        steps={STEPS}
        onNext={handleNext}
        onPrevious={handlePrevious}
        canGoNext={canGoToNextStep()}
        canGoPrevious={!isSubmitting}
        isLastStep={currentStep === STEPS.length - 1}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      >
        {/* Step Content */}
        {currentStep === 0 && (
          <CampaignForm data={campaignData} onChange={setCampaignData} />
        )}

        {currentStep === 1 && (
          <AdSetForm
            data={adSetData}
            onChange={setAdSetData}
            budgetType={campaignData.budgetType}
            currency={selectedAccountData?.currency || "USD"}
          />
        )}

        {currentStep === 2 && (
          <CreativeForm
            data={creativeData}
            onChange={setCreativeData}
            pages={pages}
            isLoadingPages={isLoadingPages}
          />
        )}

        {currentStep === 3 && (
          <ReviewStep
            campaign={campaignData}
            adSet={adSetData}
            creative={creativeData}
            status={adStatus}
            onStatusChange={setAdStatus}
            currency={selectedAccountData?.currency || "USD"}
            pages={pages}
          />
        )}
      </AdCreationWizard>
    </main>
  );
}
