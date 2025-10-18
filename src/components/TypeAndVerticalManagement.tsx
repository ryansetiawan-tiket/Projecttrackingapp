import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TypeManager } from './TypeManager';
import { VerticalManager } from './VerticalManager';
import { Palette, Layers } from 'lucide-react';

export function TypeAndVerticalManagement() {
  return (
    <div className="space-y-6">
      {/* Types Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Illustration Types</CardTitle>
              <CardDescription className="mt-1">
                Manage illustration types and their colors
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TypeManager />
        </CardContent>
      </Card>

      {/* Verticals Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Verticals</CardTitle>
              <CardDescription className="mt-1">
                Manage project verticals and their colors
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VerticalManager />
        </CardContent>
      </Card>
    </div>
  );
}
