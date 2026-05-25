import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, GripVertical, Link2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "sonner";

let idCounter = 1;
const uid = () => `link_${Date.now()}_${idCounter++}`;

export default function Step2Links({ data, update }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const addLink = () => {
    if (!title.trim() || !url.trim()) return;
    const newLink = { id: uid(), title: title.trim(), url: url.trim() };
    update({ links: [...data.links, newLink] });
    setTitle("");
    setUrl("");
    setAdding(false);
    toast.success("تم إضافة الرابط");
  };

  const removeLink = (id) => {
    update({ links: data.links.filter((l) => l.id !== id) });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(data.links);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    update({ links: items });
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg shadow-violet-100 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">الروابط الرئيسية</h2>
        <p className="text-sm text-gray-500 mt-1">أضف روابط متجرك، موقعك، منتجاتك...</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="links">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              <AnimatePresence>
                {data.links.map((link, i) => (
                  <Draggable key={link.id} draggableId={link.id} index={i}>
                    {(prov, snap) => (
                      <motion.div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border bg-gray-50 transition-shadow ${snap.isDragging ? "shadow-lg border-violet-300" : "border-gray-200"}`}
                      >
                        <div {...prov.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">{link.title}</p>
                          <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />{link.url}
                          </p>
                        </div>
                        <button onClick={() => removeLink(link.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {data.links.length === 0 && !adding && (
        <div className="text-center py-8 text-gray-400">
          <Link2 className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm">لا توجد روابط بعد</p>
        </div>
      )}

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-3"
          >
            <Input
              placeholder="عنوان الرابط (مثال: موقعنا الإلكتروني)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              dir="ltr"
              className="text-left"
            />
            <div className="flex gap-2">
              <Button onClick={addLink} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white flex-1">
                إضافة
              </Button>
              <Button onClick={() => setAdding(false)} size="sm" variant="outline">
                إلغاء
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!adding && (
        <Button
          onClick={() => setAdding(true)}
          variant="outline"
          className="w-full border-dashed border-violet-300 text-violet-600 hover:bg-violet-50 gap-2"
        >
          <Plus className="w-4 h-4" /> إضافة رابط جديد
        </Button>
      )}
    </div>
  );
}