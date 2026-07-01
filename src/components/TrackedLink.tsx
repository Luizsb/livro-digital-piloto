import type { AnchorHTMLAttributes, ReactNode } from 'react';
import type { LinkTrackType } from '../analytics/contentInteractionTypes';

export interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  linkId: string;
  page: number;
  type?: LinkTrackType;
  children: ReactNode;
}

/**
 * Link com atributos de rastreamento (`data-track-link-*`).
 * O clique é capturado por `useLinkClickTracking`.
 */
function TrackedLink({
  linkId,
  page,
  type = 'external_link',
  children,
  ...anchorProps
}: TrackedLinkProps) {
  return (
    <a
      {...anchorProps}
      data-track-link-id={linkId}
      data-track-page={page}
      data-track-link-type={type}
      data-track-href={anchorProps.href}
    >
      {children}
    </a>
  );
}

export default TrackedLink;
