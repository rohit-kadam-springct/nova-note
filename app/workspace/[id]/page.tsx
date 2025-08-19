import WorkspaceClient from "./workspace-client";

export default function WorkspacePage({ params }: { params: { id: string } }) {
  return <WorkspaceClient id={params.id} />;
}