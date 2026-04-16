using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using CourtBooking.Server.Models;

namespace CourtBooking.Server.Services
{
    public class PrunePendingMatchesService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<PrunePendingMatchesService> _logger;
        private readonly TimeSpan _interval = TimeSpan.FromHours(24); // run daily

        public PrunePendingMatchesService(IServiceProvider services, ILogger<PrunePendingMatchesService> logger)
        {
            _services = services;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // run immediately at startup then on interval
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _services.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var cutoff = DateTime.Now.AddDays(-14);
                    var stale = db.MatchResults.Where(m => !m.Confirmed && m.DatePlayed < cutoff).ToList();
                    if (stale.Any())
                    {
                        db.MatchResults.RemoveRange(stale);
                        await db.SaveChangesAsync(stoppingToken);
                        _logger.LogInformation("Pruned {Count} stale match results older than {Cutoff}.", stale.Count, cutoff);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error pruning pending match results");
                }

                try
                {
                    await Task.Delay(_interval, stoppingToken);
                }
                catch (TaskCanceledException) { /* shutting down */ }
            }
        }
    }
}