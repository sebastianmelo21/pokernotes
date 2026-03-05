import HandView from '@/components/HandView/HandView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HandPage({ params }: Props) {
  const { id } = await params;
  return <HandView handId={id} />;
}
