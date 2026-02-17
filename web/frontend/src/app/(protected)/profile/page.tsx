"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Camera,
  Mail,
  MapPin,
  Link as LinkIcon,
  User,
  Save,
  Loader2,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui or similar
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuthToken";
import { getMyRestaurantAlias, RestaurantDetails } from "@/lib/restaurants";
// You might need to adjust imports based on your actual file structure
// I'm using Lucide icons as they are standard for SaaS

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [restaurantLoading, setRestaurantLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const data = await getMyRestaurantAlias();
        setRestaurant(data);
      } catch (error) {
        console.error("Failed to fetch restaurant details:", error);
      } finally {
        setRestaurantLoading(false);
      }
    };

    if (!authLoading) {
      fetchRestaurant();
    }
  }, [authLoading]);

  const [data, setData] = useState({
    name: "Danish Heilium",
    role: "Product Designer",
    location: "San Francisco, CA",
    website: "https://danish.design",
    about:
      "Passionate about building accessible and beautiful user experiences. Currently working on the next generation of SaaS tools.",
    profilePhoto: "/images/user/user-03.png",
    coverPhoto: "/images/cover/cover-01.png", // Kept for legacy support, but used subtly
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "profilePhoto" | "coverPhoto",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setData((prev) => ({
        ...prev,
        [field]: URL.createObjectURL(file),
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
  };

  if (authLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 space-y-8">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Profile
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your personal information and public profile presence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="min-w-[100px]"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 2. Left Column: Identity Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-border/60 shadow-sm">
            {/* Subtle Cover Banner */}
            <div className="h-32 bg-muted relative group">
              {data.coverPhoto && (
                <Image
                  src={data.coverPhoto}
                  alt="Cover"
                  fill
                  className="object-cover opacity-80 transition-opacity group-hover:opacity-60"
                />
              )}
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-medium">
                  Change Cover
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "coverPhoto")}
                    accept="image/*"
                  />
                </label>
              )}
            </div>

            <CardContent className="pt-0 relative px-6 pb-6">
              {/* Profile Avatar */}
              <div className="relative -mt-12 mb-4 w-24 h-24 rounded-full border-4 border-background bg-background shadow-sm overflow-hidden group">
                <Image
                  src={data.profilePhoto || "/placeholder-avatar.png"}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
                {isEditing && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-6 w-6 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "profilePhoto")}
                      accept="image/*"
                    />
                  </label>
                )}
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold">{user?.username}</h2>
                <p className="text-sm text-muted-foreground">{user?.role}</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email || "email@example.com"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{data.location}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <LinkIcon className="h-4 w-4" />
                  <a
                    href={data.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline transition-colors"
                  >
                    {data.website.replace("https://", "")}
                  </a>
                </div>
              </div>

              {/* <Separator className="my-6" /> */}

              {/* Mini Stats (Clean Layout) */}
              {/* <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <div className="text-lg font-bold">259</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Posts</div>
                </div>
                <div>
                    <div className="text-lg font-bold">129k</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Followers</div>
                </div>
                <div>
                    <div className="text-lg font-bold">2k</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Following</div>
                </div>
              </div> */}
            </CardContent>
          </Card>
        </div>

        {/* 3. Right Column: Editable Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* General Info Card */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">General Information</CardTitle>
              <CardDescription>
                Update your public profile details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={user?.username || ""}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    disabled={!isEditing}
                    className="bg-muted/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role / Job Title</Label>
                  <Input
                    id="role"
                    value={user?.role}
                    onChange={(e) => setData({ ...data, role: e.target.value })}
                    disabled={!isEditing}
                    className="bg-muted/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={data.location}
                    onChange={(e) =>
                      setData({ ...data, location: e.target.value })
                    }
                    disabled={!isEditing}
                    className="bg-muted/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={data.website}
                    onChange={(e) =>
                      setData({ ...data, website: e.target.value })
                    }
                    disabled={!isEditing}
                    className="bg-muted/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About</Label>
                <Textarea
                  id="about"
                  rows={4}
                  value={data.about}
                  onChange={(e) => setData({ ...data, about: e.target.value })}
                  disabled={!isEditing}
                  className="bg-muted/10 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Restaurant Details Card */}
          {restaurantLoading ? (
            <Card className="border-border/60 shadow-sm">
              <CardContent className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : restaurant ? (
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <CardTitle className="text-lg">Restaurant Details</CardTitle>
                </div>
                <CardDescription>
                  Your associated restaurant information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="restaurantName">Restaurant Name</Label>
                    <Input
                      id="restaurantName"
                      value={restaurant.name}
                      disabled
                      className="bg-muted/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurantSlug">Slug</Label>
                    <Input
                      id="restaurantSlug"
                      value={restaurant.slug}
                      disabled
                      className="bg-muted/10"
                    />
                  </div>
                </div>

                {restaurant.created_at && (
                  <div className="text-xs text-muted-foreground pt-1">
                    Created on{" "}
                    {new Date(restaurant.created_at).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Account Status / Additional Card */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="space-y-1">
                  <div className="font-medium flex items-center gap-2">
                    Current Plan:{" "}
                    <Badge>{restaurant?.subscription_tier || "Free"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your subscription renews on Nov 14, 2025.
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
