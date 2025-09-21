declare module '@/src/services/downloadManager' {
  export type DownloadResult = {
    success: boolean;
    localPath?: string;
    message?: string;
    error?: string;
    skipped?: boolean;
  };

  export function downloadLesson(
    lesson: any,
    onProgress?: (progress: any) => void
  ): Promise<DownloadResult>;

  export function downloadAllLessonsInLevel(
    lessons: any[],
    onProgress?: (progress: any) => void,
    onLessonComplete?: (lesson: any, result: DownloadResult) => void
  ): Promise<DownloadResult[]>;

  export function getLocalLessonContent(lesson: any): Promise<any>;
  export function deleteLocalLesson(lesson: any): Promise<{ success: boolean; error?: string }>; 
  export function getDownloadedLessonsSize(): Promise<{ totalSize: number; fileCount: number; formattedSize: string }>; 
  export function clearAllDownloads(): Promise<{ success: boolean; error?: string }>; 
  export function isNetworkAvailable(): Promise<boolean>;
}
