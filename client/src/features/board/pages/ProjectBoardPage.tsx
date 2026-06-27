import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { useAppDispatch, useAppSelector, useSocketBoard } from '../../../hooks';
import {
    getBoardColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    moveTask,
    updateTaskOptimistic,
} from '../boardSlice';
import { getProjectById } from '../../projects/projectsSlice';
import BoardColumn from '../components/BoardColumn';
import CreateTaskModal from '../components/CreateTaskModal';
import ClientLinkModal from '../components/ClientLinkModal';
import TaskDetailModal from '../../tasks/components/TaskDetailModal';
import { Plus, ArrowLeft, Link2 } from 'lucide-react';

const ProjectBoardPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { columns, isLoading, error } = useAppSelector((state) => state.board);
    const { currentProject } = useAppSelector((state) => state.projects);
    const [showAddColumn, setShowAddColumn] = useState(false);
    const [newColumnName, setNewColumnName] = useState('');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [addTaskColumnId, setAddTaskColumnId] = useState<string | null>(null);
    const [showClientLink, setShowClientLink] = useState(false);

    // Set up Socket.io listeners for real-time board updates
    useSocketBoard(projectId);

    useEffect(() => {
        if (projectId) {
            void dispatch(getBoardColumns(projectId));
            void dispatch(getProjectById(projectId));
        }
    }, [dispatch, projectId]);

    const project = currentProject?.id === projectId ? currentProject : null;
    const refreshBoard = () => {
        if (projectId) void dispatch(getBoardColumns(projectId));
    };

    const handleDeleteColumn = async (columnId: string) => {
        if (confirm('Are you sure you want to delete this column? Its tasks will be deleted too.')) {
            await dispatch(deleteColumn(columnId));
            refreshBoard();
        }
    };

    const handleRenameColumn = async (columnId: string, name: string) => {
        await dispatch(updateColumn({ columnId, name }));
    };

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        // If dropped outside or in same position, do nothing
        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
            return;
        }

        // Optimistic update to UI
        dispatch(
            updateTaskOptimistic({
                taskId: draggableId,
                sourceColumnId: source.droppableId,
                destColumnId: destination.droppableId,
                newIndex: destination.index,
            })
        );

        // Send to backend; if it fails, reload the real order
        const response = await dispatch(
            moveTask({
                taskId: draggableId,
                destColumnId: destination.droppableId,
                position: destination.index,
            })
        );
        if (moveTask.rejected.match(response)) {
            refreshBoard();
        }
    };

    const handleCreateColumn = async () => {
        if (newColumnName.trim().length >= 2 && projectId) {
            await dispatch(createColumn({ projectId, name: newColumnName.trim() }));
            setNewColumnName('');
            setShowAddColumn(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (error && columns.length === 0) {
        return (
            <div className="text-center py-16 space-y-3">
                <p className="text-gray-600">{error}</p>
                <button onClick={() => navigate('/workspaces')} className="text-primary-600 hover:text-primary-700">
                    Back to workspaces
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(project ? `/workspaces/${project.workspaceId}` : '/workspaces')}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        aria-label="Back"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{project?.name || 'Project Board'}</h1>
                        {project?.description && <p className="text-sm text-gray-500 mt-1">{project.description}</p>}
                    </div>
                </div>
                <button onClick={() => setShowClientLink(true)} className="btn-secondary flex items-center">
                    <Link2 className="h-4 w-4 mr-2" />
                    Client link
                </button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex-1 overflow-x-auto">
                    <div className="flex gap-4 h-full pb-4">
                        {columns.map((column) => (
                            <Droppable key={column.id} droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-shrink-0 w-80 ${snapshot.isDraggingOver ? 'bg-primary-50 rounded-lg' : ''}`}
                                    >
                                        <BoardColumn
                                            column={column}
                                            onTaskClick={(taskId) => setSelectedTaskId(taskId)}
                                            onAddTask={(columnId) => setAddTaskColumnId(columnId)}
                                            onDeleteColumn={handleDeleteColumn}
                                            onRenameColumn={handleRenameColumn}
                                        />
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        ))}

                        <div className="flex-shrink-0 w-80">
                            {showAddColumn ? (
                                <div className="bg-gray-100 rounded-lg p-3">
                                    <input
                                        type="text"
                                        value={newColumnName}
                                        onChange={(e) => setNewColumnName(e.target.value)}
                                        placeholder="Enter column name..."
                                        className="input-base mb-2"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreateColumn();
                                            if (e.key === 'Escape') setShowAddColumn(false);
                                        }}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleCreateColumn} className="btn-primary text-sm">
                                            Add Column
                                        </button>
                                        <button onClick={() => setShowAddColumn(false)} className="btn-secondary text-sm">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAddColumn(true)}
                                    className="w-full h-full min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition-colors"
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Add Column
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </DragDropContext>

            {projectId && (
                <CreateTaskModal
                    projectId={projectId}
                    columnId={addTaskColumnId}
                    onClose={() => setAddTaskColumnId(null)}
                />
            )}

            {projectId && (
                <ClientLinkModal
                    projectId={projectId}
                    isOpen={showClientLink}
                    onClose={() => setShowClientLink(false)}
                />
            )}

            <TaskDetailModal
                taskId={selectedTaskId || ''}
                isOpen={!!selectedTaskId}
                workspaceId={project?.workspaceId}
                onClose={() => {
                    setSelectedTaskId(null);
                    refreshBoard();
                }}
            />
        </div>
    );
};

export default ProjectBoardPage;
