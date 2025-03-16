import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead, Assignment, Agent } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: leads, isLoading: isLoadingLeads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: agents, isLoading: isLoadingAgents } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: assignments, isLoading: isLoadingAssignments } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  const syncLeadsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/leads/sync");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Leads synced successfully",
        description: "New leads have been imported from HubSpot",
      });
    },
    onError: (error) => {
      toast({
        title: "Error syncing leads",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncAgentsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agents/sync");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Agents synced successfully",
        description: "New agents have been imported from HubSpot",
      });
    },
    onError: (error) => {
      toast({
        title: "Error syncing agents",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const autoAssignMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/assignments/auto");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Leads assigned successfully",
        description: "The AI has matched leads with the best agents",
      });
    },
    onError: (error) => {
      toast({
        title: "Error assigning leads",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoadingLeads || isLoadingAgents || isLoadingAssignments) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const unassignedLeads = leads?.filter(lead => !lead.assignedAgentId) || [];
  const totalAssignments = assignments?.length || 0;
  const activeAgents = agents?.filter(agent => agent.status === "active") || [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lead Assignment Dashboard</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => syncAgentsMutation.mutate()}
            disabled={syncAgentsMutation.isPending}
          >
            {syncAgentsMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sync HubSpot Agents
          </Button>
          <Button
            onClick={() => syncLeadsMutation.mutate()}
            disabled={syncLeadsMutation.isPending}
          >
            {syncLeadsMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sync HubSpot Leads
          </Button>
          <Button
            onClick={() => autoAssignMutation.mutate()}
            disabled={autoAssignMutation.isPending || unassignedLeads.length === 0}
          >
            {autoAssignMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Auto-Assign Leads
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{unassignedLeads.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalAssignments}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeAgents.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Recent Assignments</h2>
        <div className="rounded-md border">
          <div className="p-4">
            {assignments && assignments.length > 0 ? (
              <div className="divide-y">
                {assignments.slice(0, 5).map((assignment) => {
                  const lead = leads?.find(l => l.id === assignment.leadId);
                  const agent = agents?.find(a => a.id === assignment.agentId);

                  return (
                    <div key={assignment.id} className="py-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{lead?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Assigned to: {agent?.name}
                          </p>
                        </div>
                        <div className="text-sm">
                          Match Score: {assignment.matchScore}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No assignments yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}