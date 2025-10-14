<script lang="ts">
  import type { Comment, User, MediaMap } from "@lib/types";

  let { comments, user } = $props<{
    comments: Comment[];
    user: User;
    media: MediaMap;
  }>();
</script>

<div class="p-4">
  <h1 class="text-2xl font-bold mb-4">Comments</h1>
  <div class="space-y-4">
    {#each comments as comment}
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <p>{comment.text}</p>
          <div class="text-sm opacity-70">
            <span>By: {user.username}</span>
            <span> | </span>
            <span>On post: {comment.postId}</span>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
