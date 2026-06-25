import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdminAnalytics,
  fetchAdminUsers,
  updateAdminUser,
  fetchAdminWorkouts
} from '../store/slices/adminSlice';
import {
  Users,
  Activity,
  Calendar,
  Flame,
  Milestone,
  TrendingUp,
  Search,
  Filter,
  ArrowUpDown,
  UserCheck,
  UserMinus,
  ShieldAlert,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { analytics, users, workouts, loading, error } = useSelector(state => state.admin);
  const currentUser = useSelector(state => state.auth.user);

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState({ column: 'joinDate', direction: 'desc' });

  useEffect(() => {
    dispatch(fetchAdminAnalytics());
    dispatch(fetchAdminUsers());
    dispatch(fetchAdminWorkouts());
  }, [dispatch]);

  // Handle User Status toggle
  const handleToggleStatus = (userId, currentStatus) => {
    if (userId === currentUser.id) {
      alert('You cannot deactivate your own account.');
      return;
    }
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    dispatch(updateAdminUser({ id: userId, status: newStatus }));
  };

  // Handle User Role change
  const handleRoleChange = (userId, newRole) => {
    dispatch(updateAdminUser({ id: userId, role: newRole }));
  };

  // Filter & Sort Users
  const sortedAndFilteredUsers = useMemo(() => {
    let result = [...users];

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
      );
    }

    // Role Filter
    if (roleFilter !== 'All') {
      result = result.filter(u => u.role === roleFilter);
    }

    // Status Filter
    if (statusFilter !== 'All') {
      result = result.filter(u => u.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortBy.column];
      let bVal = b[sortBy.column];

      // Handle nulls/missing values
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (typeof aVal === 'string') {
        return sortBy.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortBy.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

    return result;
  }, [users, searchTerm, roleFilter, statusFilter, sortBy]);

  const handleSort = (column) => {
    setSortBy(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading && !analytics) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="font-semibold text-lg">Fetching platform metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="text-accent w-7 h-7" /> Admin Control Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitor activity trends, manage users, and view platform-wide telemetry.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-700 shadow-md text-accent'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Overview & Charts
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-700 shadow-md text-accent'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            User Directory
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'feed'
                ? 'bg-white dark:bg-slate-700 shadow-md text-accent'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Global Feed
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-xl text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800/60 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Total Users</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{analytics.totalUsers}</p>
                <p className="text-[10px] text-success font-semibold mt-0.5">{analytics.activeUsers} active now</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/60 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Activity size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Total Sessions</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{analytics.totalWorkouts}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{analytics.newUsersThisMonth} joins this month</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/60 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                <Milestone size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Run / Cycle Dist</p>
                <p className="text-lg font-black text-gray-900 dark:text-white">
                  {analytics.runningDistance}k / {analytics.cyclingDistance}k
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Swim: {analytics.swimmingDistance || 0} km</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/60 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
                <Flame size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Total Burned</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  {analytics.totalCaloriesBurned.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Estimated Calories</p>
              </div>
            </div>
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Activity Area Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <TrendingUp size={16} /> Weekly Training Volume Trends
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.weeklyActivityTrends}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" stroke="#888888" fontSize={10} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" name="Workouts Logged" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sport Distribution Pie Chart */}
            <div className="bg-white dark:bg-slate-800/60 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Workout Distribution</h3>
              <div className="h-48 flex justify-center items-center">
                {analytics.workoutDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.workoutDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="sport"
                      >
                        {analytics.workoutDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-gray-400">No workout records available</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-center pb-2">
                {analytics.workoutDistribution.map((entry, index) => (
                  <div key={entry.sport} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span>{entry.sport} ({entry.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Days bar chart */}
            <div className="bg-white dark:bg-slate-800/60 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Calendar size={16} /> Most Active Training Days
              </h3>
              <div className="h-64">
                {analytics.activeDays.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.activeDays}>
                      <XAxis dataKey="day_name" stroke="#888888" fontSize={10} tickLine={false} />
                      <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Workouts Logged" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-gray-400 flex items-center justify-center h-48">No activity trends logged yet</p>
                )}
              </div>
            </div>

            {/* Platform stats report helper */}
            <div className="lg:col-span-2 bg-gradient-to-tr from-accent/10 via-blue-500/5 to-transparent border border-gray-100 dark:border-gray-800 p-6 rounded-2xl flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-base font-black tracking-tight text-accent">Platform Telemetry Status</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  Platform resources are fully operational. Standard queries are processing correctly, and telemetry values reflect all active logs in the database. Use the report tabs above to update roles and status levels.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="border border-gray-100 dark:border-slate-800 p-3 rounded-xl bg-white/40 dark:bg-slate-900/30">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Average Activity Rate</p>
                    <p className="text-sm font-black text-gray-800 dark:text-white mt-1">
                      {analytics.totalUsers > 0 ? Math.round((analytics.totalWorkouts / analytics.totalUsers) * 10) / 10 : 0} logs / user
                    </p>
                  </div>
                  <div className="border border-gray-100 dark:border-slate-800 p-3 rounded-xl bg-white/40 dark:bg-slate-900/30">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Monthly growth rate</p>
                    <p className="text-sm font-black text-gray-800 dark:text-white mt-1">
                      +{analytics.totalUsers > 0 ? Math.round((analytics.newUsersThisMonth / analytics.totalUsers) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 text-[10px] text-gray-400 items-center justify-end pt-4 border-t border-gray-100 dark:border-slate-800/80">
                <Clock size={12} /> Sync time: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fade-in">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Filter size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400 font-medium">Role:</span>
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                >
                  <option value="All">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                  <option value="Coach">Coach</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="p-4 cursor-pointer hover:text-gray-600 dark:hover:text-white" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">User Info <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-gray-600 dark:hover:text-white" onClick={() => handleSort('role')}>
                    <div className="flex items-center gap-1">Role <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-gray-600 dark:hover:text-white" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Status <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-gray-600 dark:hover:text-white" onClick={() => handleSort('joinDate')}>
                    <div className="flex items-center gap-1">Joined <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="p-4 text-center">Workouts</th>
                  <th className="p-4 text-center">Run / Cycle KM</th>
                  <th className="p-4 text-center">PRs</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sortedAndFilteredUsers.length > 0 ? (
                  sortedAndFilteredUsers.map(u => {
                    const initials = u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        {/* Avatar & User details */}
                        <td className="p-4 flex items-center gap-3">
                          {u.photo ? (
                            <img src={u.photo} alt={u.name} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent to-blue-500 flex items-center justify-center font-bold text-white uppercase text-[10px]">
                              {initials}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{u.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{u.email}</p>
                          </div>
                        </td>

                        {/* Role selector */}
                        <td className="p-4">
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            className="bg-gray-100 dark:bg-slate-700 border border-transparent hover:border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
                          >
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                            <option value="Coach">Coach</option>
                            <option value="Manager">Manager</option>
                          </select>
                        </td>

                        {/* Status Badge */}
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full font-bold text-[10px] ${
                            u.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                          }`}>
                            {u.status}
                          </span>
                        </td>

                        {/* Join Date / Last login */}
                        <td className="p-4">
                          <p className="font-medium">{u.joinDate}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Last active: {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                          </p>
                        </td>

                        {/* Workout Count */}
                        <td className="p-4 text-center font-bold text-gray-700 dark:text-gray-300">
                          {u.workoutCount}
                        </td>

                        {/* Distances */}
                        <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                          <span className="font-bold">{u.runningDistance}</span> / <span className="font-bold">{u.cyclingDistance}</span>
                        </td>

                        {/* PRs */}
                        <td className="p-4 text-center font-bold text-accent">
                          {u.prCount}
                        </td>

                        {/* Toggle Status Action */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            disabled={u.id === currentUser.id}
                            className={`p-1.5 rounded-lg border transition-all ${
                              u.id === currentUser.id
                                ? 'opacity-30 cursor-not-allowed'
                                : u.status === 'Active'
                                ? 'border-red-100 dark:border-red-950/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500'
                                : 'border-emerald-100 dark:border-emerald-950/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-500'
                            }`}
                            title={u.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                          >
                            {u.status === 'Active' ? <UserMinus size={14} /> : <UserCheck size={14} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-400">
                      No users match the search queries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GLOBAL FEED TAB */}
      {activeTab === 'feed' && (
        <div className="space-y-4 max-w-3xl mx-auto animate-fade-in">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <Activity size={16} /> Recent Platform Activity Logs
          </h3>
          <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-4 space-y-6 py-2">
            {workouts.length > 0 ? (
              workouts.map((w) => (
                <div key={w.id} className="relative pl-6">
                  {/* Dot */}
                  <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-accent" />
                  
                  {/* Card content */}
                  <div className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-xs">{w.athlete}</span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="text-[10px] text-gray-400">{w.date}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        w.sport === 'Running' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
                        w.sport === 'Cycling' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' :
                        w.sport === 'Swimming' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500' :
                        'bg-purple-50 dark:bg-purple-900/20 text-purple-500'
                      }`}>
                        {w.sport}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-500 dark:text-gray-400 pt-1">
                      <div>
                        <span className="font-bold text-gray-950 dark:text-white">{w.distance || 0}</span> km
                      </div>
                      <div>
                        Duration: <span className="font-bold text-gray-950 dark:text-white">{w.duration}</span>
                      </div>
                      <div>
                        RPE: <span className="font-bold text-gray-950 dark:text-white">{w.rpe}</span>/10
                      </div>
                    </div>

                    {w.notes && (
                      <p className="text-[10px] text-gray-500 italic bg-gray-55 dark:bg-slate-800 p-2 rounded-xl">
                        "{w.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 text-gray-400">
                No activity logged across the platform yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

// Date formatter helpers
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const format = (date, formatStr) => {
  if (formatStr === 'MMM yyyy') {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return date.toLocaleDateString();
};
