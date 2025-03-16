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
import type { Agent, Assignment, PerformanceMetric } from "@shared/schema";

export default function Analytics() {
  const { data: agents, isLoading: isLoadingAgents } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: assignments, isLoading: isLoadingAssignments } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  if (isLoadingAgents || isLoadingAssignments) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Calculate conversion rates by agent
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
      avgResponseTime: agent.responseTime,
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
            <p className="text-3xl font-bold">{agents?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{assignments?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average AI Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Math.round(
                (agents?.reduce((sum, agent) => sum + agent.aiScore, 0) || 0) /
                  (agents?.length || 1)
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Math.round(
                (assignments?.filter(a => a.status === "converted").length || 0) /
                  (assignments?.length || 1) * 100
              )}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
            <CardDescription>Conversion rates by agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conversionRate" fill="#2563eb" name="Conversion Rate %" />
                  <Bar dataKey="aiScore" fill="#7c3aed" name="AI Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Times</CardTitle>
            <CardDescription>Average response time by agent (minutes)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgResponseTime" fill="#2563eb" name="Avg Response Time" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Details</CardTitle>
          <CardDescription>Detailed performance metrics for each agent</CardDescription>
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
  );
}