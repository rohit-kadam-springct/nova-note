import WorkspaceClient from "./workspace-client";

export default function WorkspacePage({ params }: { params: any }) {
  return <WorkspaceClient id={params.id} />;
}