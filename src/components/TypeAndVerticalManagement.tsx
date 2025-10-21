import { TypeManager } from './TypeManager';
import { VerticalManager } from './VerticalManager';

export function TypeAndVerticalManagement() {
  return (
    <div className="space-y-6">
      {/* Types Section - No wrapper card (TypeManager has its own layout) */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Illustration Types</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage illustration types and their colors
          </p>
        </div>
        <TypeManager />
      </div>

      {/* Verticals Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Verticals</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage project verticals and their colors
          </p>
        </div>
        <VerticalManager />
      </div>
    </div>
  );
}
