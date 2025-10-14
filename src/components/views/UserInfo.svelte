<script lang="ts">
  import { format, differenceInYears } from "date-fns";
  import {
    User as UserIcon,
    MapPin,
    Calendar,
    Globe,
    Smartphone,
    Clock,
    Flag,
  } from "@lucide/svelte";
  import type { User, MediaMap } from "@lib/types";

  interface Props {
    user: User;
    media: MediaMap;
  }

  let { user, media }: Props = $props();

  const userAge = $derived.by(() => {
    if (!user.birthdate) return null;

    let birthDate: Date;
    if (typeof user.birthdate === "string") {
      birthDate = new Date(user.birthdate);
    } else if (typeof user.birthdate === "object" && "year" in user.birthdate) {
      birthDate = new Date(
        user.birthdate.year,
        user.birthdate.month - 1,
        user.birthdate.day
      );
    } else {
      return null;
    }

    return differenceInYears(new Date(), birthDate);
  });

  const memberSince = $derived.by(() => {
    if (!user.creationDate) return "Unknown";
    return format(new Date(user.creationDate), "MMM dd yyyy");
  });

  const deviceInfo = $derived.by(() => {
    if (typeof user.device === "string") {
      return user.device;
    }
    return "Unknown Device";
  });

  const platformName = $derived.by(() => {
    if ("platform" in user) {
      switch (user.platform) {
        case 1:
          return "iOS";
        case 2:
          return "Android";
        default:
          return "Unknown";
      }
    }
    return deviceInfo.includes("iOS") ? "iOS" : "Android";
  });
</script>

<div class="space-y-6">
  <div class="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-xl">
    <div class="card-body">
      <div class="flex flex-col md:flex-row items-center gap-6">
        <div class="avatar">
          <div
            class="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
          >
            {#if user.profilePicture && media[user.profilePicture.path]}
              <img
                src={media[user.profilePicture.path]}
                alt={user.fullname}
                class="rounded-full object-cover"
              />
            {:else}
              <div class="bg-primary/20 flex items-center justify-center">
                <UserIcon class="w-16 h-16 text-primary" />
              </div>
            {/if}
          </div>
        </div>

        <div class="text-center md:text-left flex-1">
          <h1 class="text-3xl font-bold">{user.fullname}</h1>
          <p class="text-xl opacity-70 mb-2">@{user.username}</p>

          {#if user.biography}
            <div class="chat chat-start">
              <div class="chat-bubble chat-bubble-primary">
                "{user.biography}"
              </div>
            </div>
          {/if}

          <div
            class="flex flex-wrap gap-2 mt-4 justify-center md:justify-start"
          >
            <div class="badge badge-primary">Member since {memberSince}</div>
            {#if userAge}
              <div class="badge badge-secondary">{userAge} years old</div>
            {/if}
            <div class="badge badge-outline">{platformName} User</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div class="stats shadow">
      <div class="stat">
        <div class="stat-figure text-primary">
          <Calendar class="w-8 h-8" />
        </div>
        <div class="stat-title">Age</div>
        <div class="stat-value text-primary">{userAge || "N/A"}</div>
        <div class="stat-desc">years old</div>
      </div>
    </div>

    <div class="stats shadow">
      <div class="stat">
        <div class="stat-figure text-secondary">
          <MapPin class="w-8 h-8" />
        </div>
        <div class="stat-title">Location</div>
        <div class="stat-value text-secondary text-lg">
          {user.location || "N/A"}
        </div>
        <div class="stat-desc">{user.countryCode || ""}</div>
      </div>
    </div>

    <div class="stats shadow">
      <div class="stat">
        <div class="stat-figure text-accent">
          <Smartphone class="w-8 h-8" />
        </div>
        <div class="stat-title">Platform</div>
        <div class="stat-value text-accent text-lg">{platformName}</div>
        <div class="stat-desc">v{user.clientVersion || "Unknown"}</div>
      </div>
    </div>

    <div class="stats shadow">
      <div class="stat">
        <div class="stat-figure text-info">
          <Clock class="w-8 h-8" />
        </div>
        <div class="stat-title">Timezone</div>
        <div class="stat-value text-info text-lg">
          {user.timezone?.split("/")[1] || "N/A"}
        </div>
        <div class="stat-desc">{user.timezone?.split("/")[0] || ""}</div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">
          <UserIcon class="w-5 h-5" />
          Personal Information
        </h2>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-medium">Full Name:</span>
            <span>{user.fullname}</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="font-medium">Username:</span>
            <span class="font-mono">@{user.username}</span>
          </div>

          {#if user.birthdate}
            <div class="flex items-center justify-between">
              <span class="font-medium">Birthdate:</span>
              <span>
                {#if typeof user.birthdate === "object" && "year" in user.birthdate}
                  {user.birthdate.day}/{user.birthdate.month}/{user.birthdate
                    .year}
                {:else}
                  {format(new Date(user.birthdate), "dd/MM/yyyy")}
                {/if}
              </span>
            </div>
          {/if}

          {#if user.phoneNumber}
            <div class="flex items-center justify-between">
              <span class="font-medium">Phone:</span>
              <span class="font-mono">{user.phoneNumber}</span>
            </div>
          {/if}

          <div class="flex items-center justify-between">
            <span class="font-medium">Location:</span>
            <div class="flex items-center gap-1">
              <MapPin class="w-4 h-4" />
              <span>{user.location || "Not specified"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">
          <Smartphone class="w-5 h-5" />
          Device & Settings
        </h2>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-medium">Platform:</span>
            <div class="badge badge-primary">{platformName}</div>
          </div>

          {#if user.device}
            <div class="flex items-center justify-between">
              <span class="font-medium">Device:</span>
              <span class="text-sm">
                {user.device} Device
              </span>
            </div>
          {/if}

          {#if "deviceId" in user}
            <div class="flex items-center justify-between">
              <span class="font-medium">Device ID:</span>
              <span class="font-mono text-xs">{user.deviceId}</span>
            </div>
          {/if}

          <div class="flex items-center justify-between">
            <span class="font-medium">App Version:</span>
            <span>{user.clientVersion || "Unknown"}</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="font-medium">Language:</span>
            <div class="flex items-center gap-1">
              <Globe class="w-4 h-4" />
              <span>{user.language?.toUpperCase() || "N/A"}</span>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="font-medium">Region:</span>
            <span>{user.region || "N/A"}</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="font-medium">Country:</span>
            <div class="flex items-center gap-1">
              <Flag class="w-4 h-4" />
              <span>{user.countryCode || "N/A"}</span>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="font-medium">Timezone:</span>
            <div class="flex items-center gap-1">
              <Clock class="w-4 h-4" />
              <span class="text-sm">{user.timezone || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
