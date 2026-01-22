import { GymService } from '@/lib/firebase';
import ClassesClient from '@/components/classes/ClassesClient';

export const revalidate = 60; // ISR: Update at most once per minute

export default async function ClassesPage() {
    // Server-side fetch (cached)
    const classes = await GymService.getClasses();

    return <ClassesClient initialClasses={classes} />;
}
