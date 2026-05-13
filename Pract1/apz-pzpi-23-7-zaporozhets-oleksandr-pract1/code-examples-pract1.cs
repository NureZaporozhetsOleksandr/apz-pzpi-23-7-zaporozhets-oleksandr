//Приклад прямого створення об’єкта:
1  public class User
2  {
3      public string Name { get; }
4      public string Email { get; }
5      public int Age { get; }
6  
7      public User(string name, string email, int age)
8      {
9          Name = name;
10          Email = email;
11          Age = age;
12      }
13  }
14  
15  User user = new User("Sasha", "email", 18);

//Product та інтерфейс Builder:
1  public class Computer
2  {
3      public string CPU { get; set; }
4      public string RAM { get; set; }
5      public string Storage { get; set; }
6      public bool HasGraphicsCard { get; set; }
7  }
8  
9  public interface IComputerBuilder
10  {
11      void SetCPU();
12      void SetRAM();
13      void SetStorage();
14      void SetGraphicsCard();
15      Computer GetResult();
16  }

//oncreteBuilder та Director:
1  public class GamingComputerBuilder : IComputerBuilder
2  {
3      private Computer _computer = new Computer();
4  
5      public void SetCPU() => _computer.CPU = "Intel Core i7";
6      public void SetRAM() => _computer.RAM = "32 GB";
7      public void SetStorage() => _computer.Storage = "1 TB SSD";
8      public void SetGraphicsCard() => _computer.HasGraphicsCard = true;
9  
10      public Computer GetResult() => _computer;
11  }
12  
13  public class ComputerDirector
14  {
15      public void Build(IComputerBuilder builder)
16      {
17          builder.SetCPU();
18          builder.SetRAM();
19          builder.SetStorage();
20          builder.SetGraphicsCard();
21      }
22  }

//Демонстрація використання Builder:
1  IComputerBuilder builder = new GamingComputerBuilder();
2  ComputerDirector director = new ComputerDirector();
3  
4  director.Build(builder);
5  Computer computer = builder.GetResult();
6  
7  Console.WriteLine(computer.CPU);
8  Console.WriteLine(computer.RAM);
9  Console.WriteLine(computer.Storage);
10  Console.WriteLine(computer.HasGraphicsCard);

