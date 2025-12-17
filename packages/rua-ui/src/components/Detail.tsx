import React from 'react';
import { DetailProps } from '../types';

/**
 * Detail component for displaying content
 */
export function Detail({ title, markdown, children, actions }: DetailProps) {
  return (
    <div className="detail-container">
      {title && <h1 className="detail-title">{title}</h1>}
      {markdown && (
        <div
          className="detail-markdown"
          dangerouslySetInnerHTML={{ __html: markdown }}
        />
      )}
      {children && <div className="detail-content">{children}</div>}
      {actions && actions.length > 0 && (
        <div className="detail-actions">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onAction}
              className="detail-action-button"
            >
              {action.icon && <span className="action-icon">{action.icon}</span>}
              {action.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
