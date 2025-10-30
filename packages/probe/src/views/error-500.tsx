import { component$ } from '@builder.io/qwik'

export default component$(() => {
  return (
    <div class="bg-base-100 p-8">
      <div class="max-w-2xl">
        <div class="text-6xl font-light text-error mb-4">500</div>
        <h1 class="text-2xl font-medium text-base-content mb-3">Internal Server Error</h1>
        <p class="text-base text-base-content/70 mb-6">
          Something went wrong on our end. We're working to fix this issue.
        </p>

        <div class="flex gap-3">
          <button class="btn btn-sm btn-primary" onClick$={() => window.location.reload()}>
            Try Again
          </button>
          <button class="btn btn-sm btn-ghost" onClick$={() => window.history.back()}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
})
