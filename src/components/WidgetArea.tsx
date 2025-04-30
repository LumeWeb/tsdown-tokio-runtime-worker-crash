import React, { useEffect, useState } from "react";

import { useFramework } from "../contexts/framework";
import { createRemoteComponentLoader, defaultRemoteOptions } from "../plugins/remoteComponentLoader";

export interface WidgetAreaProps {
  widgetAreaId: string;
}

export function WidgetArea({ widgetAreaId }: WidgetAreaProps) {
  const framework = useFramework();
  const [widgets, setWidgets] = useState<React.ComponentType[]>([]);

  useEffect(() => {
    const registrations = framework.getWidgetRegistrations(widgetAreaId);
    const loadedWidgets = registrations.map((reg) => {
      return createRemoteComponentLoader(
        {
          componentPath: reg.componentName,
          pluginId: reg.pluginId,
        },
        framework,
        defaultRemoteOptions
      );
    });
    setWidgets(loadedWidgets);
  }, [framework, widgetAreaId]);

  return (
    <div className="widget-area">
      {widgets.map((Widget, index) => {
        return (
          <div className="widget-container" key={index}>
            <Widget />
          </div>
        );
      })}
    </div>
  );
}
