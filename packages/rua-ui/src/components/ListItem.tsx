import { forwardRef } from 'react';
import { motion } from 'motion/react';
import { ListItem as ListItemType } from '../types';
import type { Accessory as AccessoryType } from '../types';

export interface ListItemProps {
  item: ListItemType;
  active: boolean;
  onClick?: () => void;
  onPointerMove?: () => void;
  onPointerDown?: () => void;
}

/**
 * Individual list item component with icon, title, subtitle, and accessories
 */
export const ListItem = forwardRef<HTMLDivElement, ListItemProps>(
  ({ item, active, onClick, onPointerMove, onPointerDown }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={active ? 'command-item-active' : 'command-item'}
        onClick={onClick}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="command-item-content">
          {item.icon && <div className="command-item-icon">{item.icon}</div>}
          <div className="command-item-text">
            <div className="command-item-title">{item.title}</div>
            {item.subtitle && (
              <div className="command-item-subtitle">{item.subtitle}</div>
            )}
          </div>
        </div>
        {item.accessories && item.accessories.length > 0 && (
          <div className="command-item-accessories">
            {item.accessories.map((accessory, index) => (
              <Accessory key={index} accessory={accessory} />
            ))}
          </div>
        )}
      </motion.div>
    );
  }
);

ListItem.displayName = 'ListItem';

/**
 * Accessory component for displaying additional info on the right side
 */
function Accessory({ accessory }: { accessory: AccessoryType }) {
  return (
    <div className="command-item-accessory" title={accessory.tooltip}>
      {accessory.icon && <span className="accessory-icon">{accessory.icon}</span>}
      {accessory.text && <span className="accessory-text">{accessory.text}</span>}
    </div>
  );
}
