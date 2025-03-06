import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const AdminPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    eventName: "",
    photoUrl: "",
    startTime: "",
    endTime: "",
  });

  // Fetch Participants
  const { data: participants = [], isLoading } = useQuery({
    queryKey: ["participants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("*, votes(score)");

      if (error) throw error;

      return data.map((p) => ({
        id: p.id,
        name: p.name,
        eventName: p.event_name,
        photoUrl: p.photo_url,
        startTime: p.start_time,
        endTime: p.end_time,
        score:
          p.votes && p.votes.length > 0
            ? p.votes.reduce((acc, v) => acc + v.score, 0) / p.votes.length
            : 0,
      }));
    },
  });

  // Listen for Real-time Updates
  useEffect(() => {
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants" },
        () => queryClient.invalidateQueries({ queryKey: ["participants"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Handle Add/Edit Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedParticipant) {
        const { error } = await supabase
          .from("participants")
          .update({
            name: formData.name,
            event_name: formData.eventName,
            photo_url: formData.photoUrl,
            start_time: formData.startTime,
            end_time: formData.endTime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedParticipant.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("participants").insert({
          name: formData.name,
          event_name: formData.eventName,
          photo_url: formData.photoUrl,
          start_time: formData.startTime,
          end_time: formData.endTime,
        });

        if (error) throw error;
      }

      setIsDialogOpen(false);
      setSelectedParticipant(null);
      setFormData({
        name: "",
        eventName: "",
        photoUrl: "",
        startTime: "",
        endTime: "",
      });
      queryClient.invalidateQueries({ queryKey: ["participants"] });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEdit = (id) => {
    const participant = participants.find((p) => p.id === id);
    if (participant) {
      setSelectedParticipant(participant);
      setFormData({
        name: participant.name,
        eventName: participant.eventName,
        photoUrl: participant.photoUrl,
        startTime: participant.startTime.slice(0, 16),
        endTime: participant.endTime.slice(0, 16),
      });
      setIsDialogOpen(true);
    }
  };

  const handleAdd = () => {
    setSelectedParticipant(null);
    setFormData({
      name: "",
      eventName: "",
      photoUrl: "",
      startTime: "",
      endTime: "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Event Participants</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          + Add Participant
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((participant) => (
            // <div key={participant.id} className="bg-white p-4 rounded-lg shadow-md">
            //   <img
            //     src={participant.photoUrl}
            //     alt={participant.name}
            //     className="w-16 h-16 rounded-full mx-auto mb-2"
            //   />
            //   <h2 className="text-lg font-semibold text-center">{participant.name}</h2>
            //   <p className="text-sm text-gray-500 text-center">{participant.eventName}</p>
            //   <p className="text-sm text-center mt-2">Score: <span className="font-bold">{participant.score}</span></p>
            //   <button
            //     onClick={() => handleEdit(participant.id)}
            //     className="mt-2 w-full bg-gray-800 text-white py-1 rounded-lg"
            //   >
            //     Edit
            //   </button>
            // </div>
            <div
              key={participant.id}
              className="border rounded-lg shadow-md p-4 flex flex-col items-center text-center"
            >
              {participant.photoUrl && (
                <img
                  src={participant.photoUrl}
                  alt={participant.name}
                  className="w-full h-64 object-cover rounded-md mb-3"
                />
              )}
              <h2 className="text-lg font-semibold">{participant.name}</h2>
              <p className="text-sm text-gray-500">{participant.eventName}</p>
              <div className="text-xs text-gray-600 mt-2 bg-gray-100 p-2 rounded-lg">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">📅 Start:</span>
                  <span className="font-medium">
                    {new Date(participant.startTime).toLocaleString("en-GB", {
                      hour12: false,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-gray-500">⏳ End:</span>
                  <span className="font-medium">
                    {new Date(participant.endTime).toLocaleString("en-GB", {
                      hour12: false,
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleEdit(participant.id)}
                className="mt-3 px-4 py-2 w-full text-white rounded-md bg-purple-500 hover:bg-purple-600"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dialog (Modal) */}
      {isDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">
              {selectedParticipant ? "Edit Participant" : "Add Participant"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Event Name"
                value={formData.eventName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    eventName: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="url"
                placeholder="Photo URL"
                value={formData.photoUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, photoUrl: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  {selectedParticipant ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
