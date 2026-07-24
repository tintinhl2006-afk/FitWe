import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Calendar as CalendarIcon, Clock, User, Check, Users, MapPin, Filter } from 'lucide-react-native';
import { api } from '../../../lib/apiClient';

interface GymClass {
  id: string;
  title: string;
  instructor: string;
  time: string;
  duration: string;
  room: string;
  spotsTotal: number;
  spotsBooked: number;
  category: string;
  bookedByMe?: boolean;
}

export default function ClassesScreen() {
  const [selectedDay, setSelectedDay] = useState('HOY');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [isLoading, setIsLoading] = useState(true);
  const [classList, setClassList] = useState<GymClass[]>([]);

  const categories = ['TODAS', 'CARDIO', 'FUERZA', 'MOBILITY', 'FUNCIONAL'];

  useEffect(() => {
    fetchClasses();
  }, [selectedDay]);

  async function fetchClasses() {
    setIsLoading(true);
    try {
      const res = await api.get('/api/classes').catch(() => null);
      if (res && Array.isArray(res)) {
        setClassList(res);
      } else {
        // Fallback default classes catalog
        setClassList([
          {
            id: 'c1',
            title: 'Spinning & Cardio Extreme',
            instructor: 'Carlos Gómez',
            time: '09:00 - 09:45',
            duration: '45 min',
            room: 'Sala Bici 1',
            spotsTotal: 20,
            spotsBooked: 14,
            category: 'CARDIO',
            bookedByMe: false,
          },
          {
            id: 'c2',
            title: 'Power CrossFit & Conditioning',
            instructor: 'Laura Martínez',
            time: '11:00 - 12:00',
            duration: '60 min',
            room: 'Box Funcional',
            spotsTotal: 15,
            spotsBooked: 12,
            category: 'FUNCIONAL',
            bookedByMe: true,
          },
          {
            id: 'c3',
            title: 'Yoga Vinyasa & Mobility',
            instructor: 'Sofia Ruiz',
            time: '18:30 - 19:30',
            duration: '60 min',
            room: 'Sala Mente',
            spotsTotal: 18,
            spotsBooked: 18,
            category: 'MOBILITY',
            bookedByMe: false,
          },
          {
            id: 'c4',
            title: 'BodyPump & Hipertrofia',
            instructor: 'Javier Fernández',
            time: '20:00 - 20:50',
            duration: '50 min',
            room: 'Sala Principal',
            spotsTotal: 25,
            spotsBooked: 19,
            category: 'FUERZA',
            bookedByMe: false,
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleBooking(id: string) {
    const targetClass = classList.find((c) => c.id === id);
    if (!targetClass) return;

    const isCurrentlyBooked = targetClass.bookedByMe;

    try {
      if (isCurrentlyBooked) {
        await api.delete(`/api/classes/${id}/book`).catch(() => null);
      } else {
        await api.post(`/api/classes/${id}/book`).catch(() => null);
      }

      setClassList((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            const newBooked = !c.bookedByMe;
            return {
              ...c,
              bookedByMe: newBooked,
              spotsBooked: newBooked ? c.spotsBooked + 1 : c.spotsBooked - 1,
            };
          }
          return c;
        })
      );
    } catch (error: any) {
      Alert.alert('Reserva', isCurrentlyBooked ? 'Reserva cancelada' : '¡Plaza reservada con éxito!');
    }
  }

  const filteredClasses = classList.filter(
    (c) => selectedCategory === 'TODAS' || c.category.toUpperCase() === selectedCategory
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#ffffff' }}>Clases Colectivas</Text>
          <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            Reserva tu plaza con antelación en tu centro
          </Text>
        </View>

        {/* Day Selector Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['HOY', 'MAÑANA', 'MIÉRCOLES', 'JUEVES', 'VIERNES'].map((day) => (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: selectedDay === day ? '#06b6d4' : '#1e293b',
                  borderWidth: 1,
                  borderColor: selectedDay === day ? '#06b6d4' : '#334155',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: selectedDay === day ? '#ffffff' : '#94a3b8',
                  }}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Categories Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: selectedCategory === cat ? 'rgba(6, 182, 212, 0.2)' : '#0f172a',
                  borderWidth: 1,
                  borderColor: selectedCategory === cat ? '#06b6d4' : '#1e293b',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 'bold',
                    color: selectedCategory === cat ? '#06b6d4' : '#64748b',
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Classes List */}
        {isLoading ? (
          <ActivityIndicator color="#06b6d4" style={{ marginVertical: 40 }} />
        ) : filteredClasses.length > 0 ? (
          <View style={{ gap: 14 }}>
            {filteredClasses.map((item) => {
              const isFull = item.spotsBooked >= item.spotsTotal && !item.bookedByMe;
              return (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: '#1e293b',
                    borderRadius: 20,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: item.bookedByMe ? '#10b981' : '#334155',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#ffffff' }}>{item.title}</Text>
                      <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        {item.instructor} • {item.room}
                      </Text>
                    </View>

                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: isFull ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: 'bold',
                          color: isFull ? '#f43f5e' : '#10b981',
                        }}
                      >
                        {isFull ? 'COMPLETA' : `${item.spotsTotal - item.spotsBooked} plazas libre`}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: '#334155',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} color="#64748b" />
                      <Text style={{ fontSize: 12, color: '#ffffff', fontWeight: 'bold' }}>{item.time}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => toggleBooking(item.id)}
                      disabled={isFull}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: item.bookedByMe ? '#10b981' : isFull ? '#334155' : '#06b6d4',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {item.bookedByMe && <Check size={14} color="#ffffff" />}
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: isFull ? '#94a3b8' : '#ffffff' }}>
                        {item.bookedByMe ? 'Reservado' : isFull ? 'Sin Plazas' : 'Reservar Plaza'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <CalendarIcon size={36} color="#64748b" style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>
              No hay clases colectivas programadas en esta categoría.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
