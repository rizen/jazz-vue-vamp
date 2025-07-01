<!--
/**
 * A progressive image loading component for Jazz ImageDefinition objects.
 * 
 * This component loads Jazz images progressively, starting with a placeholder
 * and automatically upgrading to higher resolutions as they become available.
 * It provides optimal loading performance and bandwidth usage for Jazz image assets.
 * 
 * @component
 * @example
 * ```vue
 * <template>
 *   <ProgressiveImg :image="userAvatar" :max-width="200">
 *     <template #default="{ src, res, originalSize }">
 *       <img 
 *         :src="src" 
 *         :alt="User Avatar"
 *         :class="{ 'loading': res === 'placeholder' }"
 *         :width="originalSize?.[0]"
 *         :height="originalSize?.[1]"
 *       />
 *     </template>
 *   </ProgressiveImg>
 * </template>
 * 
 * <script setup>
 * import { ProgressiveImg } from "jazz-vue-vamp";
 * import { useCoState } from "jazz-vue-vamp";
 * 
 * const userAvatar = useCoState(ImageDefinition, avatarId);
 * </script>
 * ```
 * 
 * @category Components
 */
-->
<script setup lang="ts">
import { ImageDefinition, type Loaded } from "jazz-tools";
import { type Ref, onUnmounted, ref, toRef, watch } from "vue";

interface ImageState {
  src?: string;
  res?: `${number}x${number}` | "placeholder";
  originalSize?: readonly [number, number];
}

/**
 * Internal composable for handling progressive image loading.
 * 
 * @param image - Reactive reference to a Jazz ImageDefinition
 * @param maxWidth - Maximum width to load (for bandwidth optimization)
 * @param targetWidth - Target display width for resolution selection
 * @returns Reactive image state with src, resolution, and original size
 * @internal
 */
function useProgressiveImg(
  image: Ref<Loaded<typeof ImageDefinition> | null | undefined>,
  maxWidth?: number,
  targetWidth?: number,
) {
  const current = ref<ImageState>({});

  let cleanup: (() => void) | undefined;
  const unsubscribe = watch(
    () => [image.value?.id, maxWidth],
    () => {
      let lastHighestRes: string | undefined;

      if (!image.value) return;

      const unsub = image.value.subscribe({}, (update) => {
        const highestRes = ImageDefinition.highestResAvailable(update, {
          maxWidth,
          targetWidth,
        });

        if (highestRes) {
          if (highestRes.res !== lastHighestRes) {
            lastHighestRes = highestRes.res;
            const blob = highestRes.stream.toBlob();

            if (blob) {
              const blobURI = URL.createObjectURL(blob);
              current.value = {
                src: blobURI,
                res: highestRes.res,
                originalSize: image.value?.originalSize,
              };

              if (cleanup) cleanup();
              cleanup = () => {
                setTimeout(() => URL.revokeObjectURL(blobURI), 200);
              };
            }
          }
        } else {
          current.value = {
            src: update?.placeholderDataURL,
            res: "placeholder",
            originalSize: image.value?.originalSize,
          };
        }
      });

      return unsub;
    },
  );

  onUnmounted(() => {
    unsubscribe();
    if (cleanup) cleanup();
  });

  return current;
}

const props = defineProps<{
  image: Loaded<typeof ImageDefinition> | null | undefined;
  maxWidth?: number;
}>();

const current = useProgressiveImg(toRef(props, "image"), props.maxWidth);
</script>

<template>
  <slot
    :src="current.src"
    :res="current.res"
    :original-size="current.originalSize"
  />
</template>