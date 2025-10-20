/**
 * VerticalGroupOrderManager Component
 * 
 * UI for managing custom order of vertical groups in Table view.
 * Defaults to alphabetical order (A-Z).
 */

import { useState, useCallback } from 'react';
import { useVerticalGroupOrder } from '../hooks/useVerticalGroupOrder';
import { useVerticals } from '../hooks/useVerticals';
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

export function VerticalGroupOrderManager() {
  const { verticals } = useVerticals();
  const {
    verticalOrder,
    isLoading,
    updateVerticalOrder,
    resetVerticalOrder
  } = useVerticalGroupOrder();

  const [showResetDialog, setShowResetDialog] = useState(false);

  // Get vertical color by name
  const getVerticalColor = (verticalName: string) => {
    const vertical = verticals.find(v => v.name === verticalName);
    return vertical?.color;
  };

  // Handle reorder
  const handleMove = useCallback((fromIndex: number, toIndex: number) => {
    const newOrder = [...verticalOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    updateVerticalOrder(newOrder);
  }, [verticalOrder, updateVerticalOrder]);

  // Handle reset
  const handleReset = async () => {
    await resetVerticalOrder();
    toast.success('Vertical order reset to alphabetical');
    setShowResetDialog(false);
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
      <div className="space-y-4">
        <div>
          <h3 className="text-lg">Vertical Group Order</h3>
          <p className="text-sm text-muted-foreground">
            Customize the order of vertical groups when grouping by Vertical in Table view.
            Default order is alphabetical (A-Z).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Vertical Order</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowResetDialog(true)}
              >
                Reset to Alphabetical
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-2">
            {verticalOrder.length > 0 ? (
              verticalOrder.map((verticalName, index) => (
                <DraggableOrderItem
                  key={verticalName}
                  id={verticalName}
                  name={verticalName}
                  index={index}
                  color={getVerticalColor(verticalName)}
                  onMove={handleMove}
                />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <p>No verticals found.</p>
                <p className="mt-2">Create verticals in Type & Vertical Management to customize order.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reset Dialog */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset to Alphabetical Order?</AlertDialogTitle>
              <AlertDialogDescription>
                This will sort verticals alphabetically (A-Z). Your custom order will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndProvider>
  );
}
