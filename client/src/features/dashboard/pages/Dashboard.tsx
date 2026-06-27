import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, FolderKanban, TrendingUp, User } from 'lucide-react';
import axios from '../../../lib/axios';

interface DashboardData {
    stats: {
        workspaces: number;
        projects: number;
        openTasks: number;
        completedTasks: number;
        assignedToMe: number;
    };
    recentProjects: Array<{
        id: string;
        name: string;
        color: string | null;
        workspaceName: string;
        openTasks: number;
        completedTasks: number;
    }>;
}

const Dashboard: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        axios
            .get('/dashboard')
            .then((response) => setData(response.data.data))
            .catch(() => setError('Could not load the dashboard'));
    }, []);

    if (error) {
        return <p className="text-red-600">{error}</p>;
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    const stats = [
        { label: 'Workspaces', value: data.stats.workspaces, icon: FolderKanban, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'Open tasks', value: data.stats.openTasks, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Completed', value: data.stats.completedTasks, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Assigned to me', value: data.stats.assignedToMe, icon: User, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Overview of your projects and tasks</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="card-base">
                        <div className="flex items-center">
                            <div className={`h-12 w-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card-base">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent projects</h2>
                    <Link to="/workspaces" className="text-sm text-primary-600 hover:text-primary-700">
                        All workspaces
                    </Link>
                </div>
                {data.recentProjects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <TrendingUp className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <p>No projects yet. Create a workspace to get started.</p>
                        <Link to="/workspaces" className="mt-3 inline-block btn-primary">
                            Go to workspaces
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {data.recentProjects.map((project) => (
                            <Link
                                key={project.id}
                                to={`/projects/${project.id}`}
                                className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-gray-50 border-b last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: project.color || '#3B82F6' }}
                                    />
                                    <div>
                                        <span className="font-medium text-gray-900">{project.name}</span>
                                        <span className="ml-2 text-xs text-gray-500">{project.workspaceName}</span>
                                    </div>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {project.openTasks} open, {project.completedTasks} done
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
