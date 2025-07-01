/**
 * Formats a date/timestamp into a localized string
 * @param timestamp - Date, timestamp number, or ISO string
 * @returns Formatted date string or 'Unknown' if invalid
 */
export const formatDate = (timestamp: number | string | Date | null | undefined): string => {
    if (!timestamp) return 'Unknown'

    try {
        return new Date(timestamp).toLocaleString()
    } catch (error) {
        console.warn('Invalid date format:', timestamp)
        return 'Unknown'
    }
} 