/**
 * StatusGroupOrderManager Component
 * 
 * UI for managing custom order of status groups in Table view.
 * Provides separate ordering for Active and Archive projects.
 */

import { useState, useCallback } from 'react';
import { useStatusGroupOrder } from '../hooks/useStatusGroupOrder';
import { useStatuses } from '../hooks/useStatuses';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { DraggableOrderItem } from './DraggableOrderItem';
import { Skeleton } from './ui/skeleton';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from './ui/alert-dialog';
import { toast } from 'sonner';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export function StatusGroupOrderManager() {
  const { statuses } = useStatuses();
  const {
    activeOrder,
    archiveOrder,
    isLoading,
    updateActiveOrder,
    updateArchiveOrder,
    resetActiveOrder,
    resetArchiveOrder
  } = useStatusGroupOrder();

  const [showResetActiveDialog, setShowResetActiveDialog] = useState(false);
  const [showResetArchiveDialog, setShowResetArchiveDialog] = useState(false);

  // Get status color by name
  const getStatusColor = (statusName: string) => {
    const status = statuses.find(s => s.name === statusName);
    return status?.color;
  };

  // Handle reorder for active statuses
  const handleMoveActive = useCallback((fromIndex: number, toIndex: number) => {
    const newOrder = [...activeOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    updateActiveOrder(newOrder);
  }, [activeOrder, updateActiveOrder]);

  // Handle reorder for archive statuses
  const handleMoveArchive = useCallback((fromIndex: number, toIndex: number) => {
    const newOrder = [...archiveOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    updateArchiveOrder(newOrder);
  }, [archiveOrder, updateArchiveOrder]);

  // Handle reset active
  const handleResetActive = async () => {
    await resetActiveOrder();
    toast.success('Active status order reset to default');
    setShowResetActiveDialog(false);
  };

  // Handle reset archive
  const handleResetArchive = async () => {
    await resetArchiveOrder();
    toast.success('Archive status order reset to default');
    setShowResetArchiveDialog(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg">Status Group Order</h3>
          <p className="text-sm text-muted-foreground">
            Customize the order of status groups in Table view. 
            Active and Archive tabs have separate orderings.
          </p>
        </div>

        {/* Active Projects Order */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Active Projects Order</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowResetActiveDialog(true)}
              >
                Reset to Default
              </Button>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              These statuses appear in the "Table" tab (non-archive projects)
            </p>
          </CardHeader>
          
          <CardContent className="space-y-2">
            {activeOrder.length > 0 ? (
              activeOrder.map((statusName, index) => (
                <DraggableOrderItem
                  key={statusName}
                  id={statusName}
                  name={statusName}
                  index={index}
                  color={getStatusColor(statusName)}
                  onMove={handleMoveActive}
                />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <p>No active statuses found.</p>
                <p className="mt-2">Create statuses in Status Manager to customize order.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Archive Projects Order */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Archive Projects Order</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowResetArchiveDialog(true)}
              >
                Reset to Default
              </Button>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              These statuses appear in the "Archive" tab
            </p>
          </CardHeader>
          
          <CardContent className="space-y-2">
            {archiveOrder.length > 0 ? (
              archiveOrder.map((statusName, index) => (
                <DraggableOrderItem
                  key={statusName}
                  id={statusName}
                  name={statusName}
                  index={index}
                  color={getStatusColor(statusName)}
                  onMove={handleMoveArchive}
                />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <p>No archive statuses found.</p>
                <p className="mt-2">&quot;Done&quot; and &quot;Canceled&quot; are default archive statuses.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reset Active Dialog */}
        <AlertDialog open={showResetActiveDialog} onOpenChange={setShowResetActiveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset to Default Order?</AlertDialogTitle>
              <AlertDialogDescription>
                This will restore the default active status order. Your custom order will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetActive}>
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Archive Dialog */}
        <AlertDialog open={showResetArchiveDialog} onOpenChange={setShowResetArchiveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset to Default Order?</AlertDialogTitle>
              <AlertDialogDescription>
                This will restore the default archive status order. Your custom order will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetArchive}>
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndProvider>
  );
}
