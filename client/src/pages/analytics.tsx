
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Loader2 } from "lucide-react";
import type { Agent, Assignment } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analytics() {
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["/api/analytics/metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
    refetchInterval: 30000,
  });

  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    refetchInterval: 30000,
  });

  const chartData = metrics?.dailyMetrics?.map((metric) => ({
    date: new Date(metric.date).toLocaleDateString(),
    assignments: metric.assignments,
    conversions: metric.conversions,
    conversionRate: metric.conversionRate
  })) || [];

  if (isLoadingMetrics) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalAgents || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalAssignments || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Average AI Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.averageAiScore || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.conversionRate || 0}%</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="assignments" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="conversionRate" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-[140px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calculate agent performance metrics
  const agentPerformance = agents?.map(agent => {
    const agentAssignments = assignments?.filter(a => a.agentId === agent.id) || [];
    const conversions = agentAssignments.filter(a => a.status === "converted").length;
    const conversionRate = agentAssignments.length > 0 
      ? (conversions / agentAssignments.length) * 100 
      : 0;

    return {
      name: agent.name,
      assignments: agentAssignments.length,
      conversions,
      conversionRate: Math.round(conversionRate),
      aiScore: agent.aiScore,
      avgResponseTime: Math.round(agent.responseTime || 0),
    };
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.totalAgents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.totalAssignments}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average AI Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.averageAiScore}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Assignment Trends</CardTitle>
            <CardDescription>Number of assignments and conversions over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.dailyMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="assignments" stroke="#8884d8" name="Assignments" />
                <Line type="monotone" dataKey="conversions" stroke="#82ca9d" name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
            <CardDescription>Detailed metrics for each agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Agent</th>
                    <th className="px-6 py-3">AI Score</th>
                    <th className="px-6 py-3">Assignments</th>
                    <th className="px-6 py-3">Conversions</th>
                    <th className="px-6 py-3">Conversion Rate</th>
                    <th className="px-6 py-3">Avg Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPerformance?.map((agent) => (
                    <tr key={agent.name} className="border-b">
                      <td className="px-6 py-4 font-medium">{agent.name}</td>
                      <td className="px-6 py-4">{agent.aiScore}</td>
                      <td className="px-6 py-4">{agent.assignments}</td>
                      <td className="px-6 py-4">{agent.conversions}</td>
                      <td className="px-6 py-4">{agent.conversionRate}%</td>
                      <td className="px-6 py-4">{agent.avgResponseTime} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
