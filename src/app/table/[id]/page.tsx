import TableView from '@/components/TableView/TableView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TablePage({ params }: Props) {
  const { id } = await params;
  return <TableView tableId={id} />;
}
