using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;

class Program
{
    static void Main()
    {
        string projectDir = @"D:\Suchith\Project\Cloud 5TB";
        string backendDir = Path.Combine(projectDir, "backend");
        string healthUrl = "http://localhost:5000/api/health";
        string appUrl = "http://localhost:5000";

        // 1. Check if backend is already running
        bool isRunning = IsServerOnline(healthUrl);

        if (!isRunning)
        {
            // Start backend silently
            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = "node.exe",
                Arguments = "dist/server.js",
                WorkingDirectory = backendDir,
                WindowStyle = ProcessWindowStyle.Hidden,
                CreateNoWindow = true,
                UseShellExecute = false
            };

            try
            {
                Process.Start(psi);
            }
            catch
            {
                // Fallback to cmd
                ProcessStartInfo cmdPsi = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c node dist/server.js",
                    WorkingDirectory = backendDir,
                    WindowStyle = ProcessWindowStyle.Hidden,
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                Process.Start(cmdPsi);
            }

            // Wait up to 6 seconds for server to come online
            for (int i = 0; i < 24; i++)
            {
                Thread.Sleep(250);
                if (IsServerOnline(healthUrl))
                {
                    break;
                }
            }
        }

        // 2. Launch Microsoft Edge in native App mode
        ProcessStartInfo edgePsi = new ProcessStartInfo
        {
            FileName = "msedge.exe",
            Arguments = "--app=" + appUrl,
            UseShellExecute = true
        };

        try
        {
            Process.Start(edgePsi);
        }
        catch
        {
            // Fallback to default browser
            Process.Start(new ProcessStartInfo(appUrl) { UseShellExecute = true });
        }
    }

    static bool IsServerOnline(string url)
    {
        try
        {
            HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
            req.Timeout = 1200;
            req.Method = "GET";
            using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
            {
                return resp.StatusCode == HttpStatusCode.OK;
            }
        }
        catch
        {
            return false;
        }
    }
}
