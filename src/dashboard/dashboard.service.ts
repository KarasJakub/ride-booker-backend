import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(
    userId: string,
    userRole: string,
    organizationId?: string,
    locationId?: string,
  ) {
    // Determine scope based on role
    let locationFilter: any = {};

    if (userRole === 'BRANCH_ADMIN') {
      const location = await this.prisma.location.findFirst({
        where: { branchAdminId: userId },
      });
      if (!location) {
        return this.emptyStats();
      }
      locationFilter = { locationId: location.id };
    } else if (userRole === 'ORG_ADMIN') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      locationFilter = {
        location: { organizationId: user?.organizationId },
      };
      if (locationId) {
        locationFilter = { locationId };
      }
    } else if (userRole === 'SUPER_ADMIN') {
      if (organizationId) {
        locationFilter = { location: { organizationId } };
      }
      if (locationId) {
        locationFilter = { locationId };
      }
    }

    const bookingWhere = { slot: { locationVehicle: locationFilter } };

    // 1. Booking counts by status
    const statusCounts = await this.prisma.booking.groupBy({
      by: ['status'],
      where: bookingWhere,
      _count: true,
    });

    const bookingsByStatus = {
      PENDING: 0,
      CONFIRMED: 0,
      REJECTED: 0,
      CANCELLED: 0,
      COMPLETED: 0,
    };
    statusCounts.forEach((s) => {
      bookingsByStatus[s.status] = s._count;
    });

    // 2. Most popular models (by booking count)
    const bookings = await this.prisma.booking.findMany({
      where: bookingWhere,
      include: {
        slot: {
          include: {
            locationVehicle: {
              include: { vehicle: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    const vehicleCounts = new Map<string, { name: string; count: number }>();
    bookings.forEach((b) => {
      const vehicle = b.slot.locationVehicle.vehicle;
      const existing = vehicleCounts.get(vehicle.id);
      if (existing) {
        existing.count++;
      } else {
        vehicleCounts.set(vehicle.id, { name: vehicle.name, count: 1 });
      }
    });
    const popularModels = Array.from(vehicleCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 3. Bookings over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBookings = await this.prisma.booking.findMany({
      where: {
        ...bookingWhere,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    });

    const dateMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dateMap.set(key, 0);
    }
    recentBookings.forEach((b) => {
      const key = b.createdAt.toISOString().split('T')[0];
      if (dateMap.has(key)) {
        dateMap.set(key, (dateMap.get(key) ?? 0) + 1);
      }
    });
    const bookingsOverTime = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // 4. Active vehicles / locations count
    const activeVehiclesCount = await this.prisma.locationVehicle.count({
      where: { ...locationFilter, isAvailable: true },
    });

    let locationsCount = 1;
    if (userRole !== 'BRANCH_ADMIN') {
      let locationScopeFilter: any = {};
      if (userRole === 'ORG_ADMIN') {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.organizationId) {
          locationScopeFilter = { organizationId: user.organizationId };
        } else {
          locationScopeFilter = {};
        }
      } else if (organizationId) {
        locationScopeFilter = { organizationId };
      }

      locationsCount = await this.prisma.location.count({
        where: locationId ? { id: locationId } : locationScopeFilter,
      });
    }

    // 5. Recent bookings list (last 10)
    const recentBookingsList = await this.prisma.booking.findMany({
      where: bookingWhere,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        slot: {
          include: {
            locationVehicle: {
              include: {
                vehicle: { select: { id: true, name: true } },
                location: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 6. Super Admin only — global counts
    let globalCounts: any = undefined;
    if (userRole === 'SUPER_ADMIN') {
      const [organizationsCount, totalLocationsCount, usersCount] = await Promise.all([
        this.prisma.organization.count(),
        this.prisma.location.count(),
        this.prisma.user.count(),
      ]);
      globalCounts = { organizationsCount, locationsCount: totalLocationsCount, usersCount };
    }

    return {
      bookingsByStatus,
      popularModels,
      bookingsOverTime,
      activeVehiclesCount,
      locationsCount,
      recentBookings: recentBookingsList,
      globalCounts,
    };
  }

  // Per-location comparison (SUPER_ADMIN, ORG_ADMIN)
  async getLocationComparison(userId: string, userRole: string, organizationId?: string) {
    let locationScope: any = {};

    if (userRole === 'ORG_ADMIN') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      locationScope = { organizationId: user?.organizationId };
    } else if (userRole === 'SUPER_ADMIN' && organizationId) {
      locationScope = { organizationId };
    }

    const locations = await this.prisma.location.findMany({
      where: locationScope,
      select: { id: true, name: true, city: true },
    });

    const comparison = await Promise.all(
      locations.map(async (loc) => {
        const bookingsCount = await this.prisma.booking.count({
          where: { slot: { locationVehicle: { locationId: loc.id } } },
        });
        const vehiclesCount = await this.prisma.locationVehicle.count({
          where: { locationId: loc.id, isAvailable: true },
        });
        return {
          locationId: loc.id,
          locationName: loc.name,
          city: loc.city,
          bookingsCount,
          vehiclesCount,
        };
      }),
    );

    return comparison.sort((a, b) => b.bookingsCount - a.bookingsCount);
  }

  private emptyStats() {
    return {
      bookingsByStatus: { PENDING: 0, CONFIRMED: 0, REJECTED: 0, CANCELLED: 0, COMPLETED: 0 },
      popularModels: [],
      bookingsOverTime: [],
      activeVehiclesCount: 0,
      locationsCount: 0,
      recentBookings: [],
      globalCounts: undefined,
    };
  }
}