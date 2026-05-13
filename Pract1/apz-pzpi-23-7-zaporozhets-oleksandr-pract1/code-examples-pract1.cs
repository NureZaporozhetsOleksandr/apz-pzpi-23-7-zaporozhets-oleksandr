//Приклад прямого створення об’єкта:
  public class User
  {
      public string Name { get; }
      public string Email { get; }
      public int Age { get; }
 
      public User(string name, string email, int age)
     {
          Name = name;
          Email = email;
          Age = age;
      }
  }
  
  User user = new User("Sasha", "email", 18);

//Product та інтерфейс Builder:
  public class Computer
  {
      public string CPU { get; set; }
     public string RAM { get; set; }
      public string Storage { get; set; }
      public bool HasGraphicsCard { get; set; }
  }
  
  public interface IComputerBuilder
  {
      void SetCPU();
      void SetRAM();
      void SetStorage();
     void SetGraphicsCard();
      Computer GetResult();
  }

//oncreteBuilder та Director:
  public class GamingComputerBuilder : IComputerBuilder
  {
      private Computer _computer = new Computer();
 
      public void SetCPU() => _computer.CPU = "Intel Core i7";
      public void SetRAM() => _computer.RAM = "32 GB";
      public void SetStorage() => _computer.Storage = "1 TB SSD";
      public void SetGraphicsCard() => _computer.HasGraphicsCard = true;
  
      public Computer GetResult() => _computer;
  }
  
  public class ComputerDirector
  {
      public void Build(IComputerBuilder builder)
      {
          builder.SetCPU();
          builder.SetRAM();
          builder.SetStorage();
          builder.SetGraphicsCard();
      }
  }

//Демонстрація використання Builder:
  IComputerBuilder builder = new GamingComputerBuilder();
  ComputerDirector director = new ComputerDirector();
  
  director.Build(builder);
  Computer computer = builder.GetResult();
  
  Console.WriteLine(computer.CPU);
  Console.WriteLine(computer.RAM);
  Console.WriteLine(computer.Storage);
  Console.WriteLine(computer.HasGraphicsCard);

