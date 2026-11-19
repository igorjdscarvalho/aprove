import { formatCompact } from '@/lib/format';
import type { ClientProfile } from '@/types/domain';
import { Avatar, type RingState } from './Avatar';

interface Props {
  client: ClientProfile;
  publications: number;
  stories: number;
  ring: RingState;
  onOpenStories?: () => void;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function ProfileHeader({ client, publications, stories, ring, onOpenStories }: Props) {
  const site = client.website.trim();
  const href = /^https?:\/\//.test(site) ? site : `https://${site}`;

  return (
    <header className="mb-6 flex items-center gap-5 sm:gap-[clamp(18px,6vw,80px)]">
      <Avatar src={client.avatar_path} ring={ring} onClick={onOpenStories} />
      <div className="min-w-0">
        <h1 className="mb-3 text-xl font-medium">{client.username}</h1>
        <ul className="mb-3 flex flex-wrap gap-x-[clamp(14px,4vw,40px)] gap-y-1.5">
          <li>
            <b>{publications}</b> {plural(publications, 'publicação', 'publicações')}
          </li>
          <li>
            <b>{stories}</b> {plural(stories, 'story', 'stories')}
          </li>
          <li>
            <b>{formatCompact(client.followers_count)}</b> seguidores
          </li>
          <li>
            <b>{formatCompact(client.following_count)}</b> seguindo
          </li>
        </ul>
        <p className="font-semibold">{client.name}</p>
        {client.category && <p className="text-muted">{client.category}</p>}
        {client.bio && <p className="whitespace-pre-wrap">{client.bio}</p>}
        {site && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-link">
            {site}
          </a>
        )}
      </div>
    </header>
  );
}
