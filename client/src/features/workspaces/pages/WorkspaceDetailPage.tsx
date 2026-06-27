import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FolderKanban, Plus } from 'lucide-react';
import axios from '../../../lib/axios';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { showToast } from '../../../utils';
import { getWorkspaceById } from '../workspacesSlice';
import { getProjects } from '../../projects/projectsSlice';
import CreateProjectModal from '../../projects/components/CreateProjectModal';

const WorkspaceDetailPage: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const dispatch = useAppDispatch();
    const { currentWorkspace, isLoading, error } = useAppSelector((state) => state.workspaces);
    const { projects } = useAppSelector((state) => state.projects);
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'member' | 'admin' | 'client'>('member');
    const [isInviting, setIsInviting] = useState(false);

    useEffect(() => {
        if (workspaceId) {
            void dispatch(getWorkspaceById(workspaceId));
            void dispatch(getProjects(workspaceId));
        }
    }, [dispatch, workspaceId]);

    const workspace = currentWorkspace?.id === workspaceId ? currentWorkspace : null;
    const isAdmin = workspace?.memberRole === 'admin';
    const canCreateProjects = workspace?.memberRole === 'admin' || workspace?.memberRole === 'member';

    const onInvite = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsInviting(true);
        try {
            await axios.post(`/workspaces/${workspaceId}/invite`, { email: inviteEmail, role: inviteRole });
            showToast.success(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
        } catch (err) {
            const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            showToast.error(message || 'Could not send the invitation');
        } finally {
            setIsInviting(false);
        }
    };

    if (!workspace) {
        return (
            <div className="flex items-center justify-center h-64">
                {isLoading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
                ) : (
                    <div className="text-center space-y-3">
                        <p className="text-gray-600">{error || 'Workspace not found'}</p>
                        <Link to="/workspaces" className="text-primary-600 hover:text-primary-700">
                            Back to workspaces
                        </Link>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/workspaces" className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Back to workspaces">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
                        {workspace.description && <p className="text-sm text-gray-500 mt-1">{workspace.description}</p>}
                    </div>
                </div>
                {canCreateProjects && (
                    <button onClick={() => setShowCreateProject(true)} className="btn-primary flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        New project
                    </button>
                )}
            </div>

            <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects</h2>
                {projects.length === 0 ? (
                    <div className="card-base text-center text-gray-500">
                        <FolderKanban className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <p>No projects yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {projects
                            .filter((p) => p.workspaceId === workspaceId && !p.isArchived)
                            .map((project) => (
                                <Link
                                    key={project.id}
                                    to={`/projects/${project.id}`}
                                    className="card-base block hover:shadow-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="h-3 w-3 rounded-full"
                                            style={{ backgroundColor: project.color || '#3B82F6' }}
                                        />
                                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                                    </div>
                                    {project.description && (
                                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{project.description}</p>
                                    )}
                                </Link>
                            ))}
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Members</h2>
                <div className="card-base divide-y">
                    {workspace.members?.map((member) => (
                        <div key={member.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                                    {member.user.fullName?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{member.user.fullName}</p>
                                    <p className="text-xs text-gray-500">{member.user.email}</p>
                                </div>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                {member.role}
                            </span>
                        </div>
                    ))}
                </div>

                {isAdmin && (
                    <form onSubmit={onInvite} className="card-base mt-4 flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[220px]">
                            <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
                                Invite by email
                            </label>
                            <input
                                id="invite-email"
                                type="email"
                                required
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="input-base"
                                placeholder="teammate@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-1">
                                Role
                            </label>
                            <select
                                id="invite-role"
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                                className="input-base"
                            >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                                <option value="client">Client</option>
                            </select>
                        </div>
                        <button type="submit" disabled={isInviting} className="btn-primary disabled:opacity-50">
                            {isInviting ? 'Sending...' : 'Send invite'}
                        </button>
                    </form>
                )}
            </section>

            {workspaceId && (
                <CreateProjectModal
                    workspaceId={workspaceId}
                    isOpen={showCreateProject}
                    onClose={() => setShowCreateProject(false)}
                />
            )}
        </div>
    );
};

export default WorkspaceDetailPage;
